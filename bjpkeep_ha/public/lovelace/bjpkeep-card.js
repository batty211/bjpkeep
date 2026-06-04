const BJPKEEP_DEFAULT_ACTOR = "{{ user }}";

class BjpKeepCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("bjpkeep-card-editor");
  }

  static getStubConfig() {
    const apiUrl = typeof window === "undefined"
      ? ""
      : `${window.location.protocol}//${window.location.hostname}:3000`;

    return {
      api_url: apiUrl,
      api_token: "",
      title: "BJP Keep",
      page_size: 10,
      show_images: true,
    };
  }

  setConfig(config) {
    if (!config.api_url) {
      throw new Error("api_url is required");
    }

    this.config = {
      api_token: "",
      actor: BJPKEEP_DEFAULT_ACTOR,
      title: "BJP Keep",
      show_images: true,
      page_size: 10,
      ...config,
      api_url: String(config.api_url).replace(/\/+$/, ""),
    };
    this.state = {
      cabinets: [],
      items: [],
      selectedCabinetId: config.cabinet_id || "",
      query: "",
      searchText: "",
      itemName: "",
      itemCabinetId: "",
      page: 1,
      pageSize: Number(config.page_size || 10),
      totalItems: 0,
      totalPages: 1,
      itemFilesLabel: "",
      addDialogOpen: false,
      detailDialogItemId: "",
      detailItem: null,
      detailItemName: "",
      detailPhotoIndex: 0,
      loading: false,
      error: "",
      message: "",
    };
    this.newItemFiles = [];

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.loadData();
  }

  getCardSize() {
    return 3;
  }

  set hass(hass) {
    this._hass = hass;
  }

  apiPath(path) {
    return `${this.config.api_url}${path}`;
  }

  imageUrl(image, options = {}) {
    const path = options.original ? image?.path : image?.thumbnailPath || image?.path;

    if (!path) {
      return "";
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return this.apiPath(path.startsWith("/") ? path : `/${path}`);
  }

  itemImageUrl(item) {
    const image = item.images?.[0];
    return this.imageUrl(image);
  }

  actorName() {
    const configuredActor = String(this.config.actor || "").trim();

    if (configuredActor === BJPKEEP_DEFAULT_ACTOR) {
      return this._hass?.user?.name || this._hass?.user?.id || "Dashboard";
    }

    return configuredActor || this._hass?.user?.name || "Dashboard";
  }

  headers() {
    return {
      Authorization: `Bearer ${this.config.api_token}`,
      "Content-Type": "application/json",
      "X-BJPKeep-Actor": this.actorName(),
    };
  }

  async request(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...this.headers(),
      ...(options.headers || {}),
    };

    if (isFormData) {
      delete headers["Content-Type"];
    }

    const response = await fetch(this.apiPath(path), {
      ...options,
      headers,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = data.error || "BJP Keep request failed";
      throw new Error(response.status === 401 ? `${message}. Check api_token in this card config.` : message);
    }

    return data;
  }

  async loadData() {
    if (!this.config) {
      return;
    }

    this.state.loading = true;
    this.state.error = "";
    this.render();

    try {
      const cabinetsResult = await this.request("/api/lovelace/?resource=cabinets&includeItems=0");
      this.state.cabinets = cabinetsResult.cabinets || [];

      if (!this.state.selectedCabinetId && this.state.cabinets[0]) {
        this.state.selectedCabinetId = this.config.cabinet_id || "";
      }

      await this.loadItems();
    } catch (error) {
      this.state.error = error.message;
    } finally {
      this.state.loading = false;
      this.render();
    }
  }

  async loadItems() {
    const params = new URLSearchParams({
      resource: "items",
      page: String(this.state.page),
      pageSize: String(this.state.pageSize),
    });

    if (this.state.selectedCabinetId) {
      params.set("cabinetId", this.state.selectedCabinetId);
    }

    if (this.state.query.trim()) {
      params.set("q", this.state.query.trim());
    }

    const result = await this.request(`/api/lovelace/?${params.toString()}`);
    this.state.items = result.items || [];
    this.state.totalItems = result.pagination?.totalItems ?? this.state.items.length;
    this.state.totalPages = result.pagination?.totalPages ?? 1;
    this.state.page = result.pagination?.page ?? this.state.page;

    if (this.state.page > this.state.totalPages && this.state.totalItems > 0) {
      this.state.page = this.state.totalPages;
      await this.loadItems();
    }
  }

  selectedCabinet() {
    return this.state.cabinets.find((cabinet) => cabinet.id === this.state.selectedCabinetId);
  }

  selectedDetailItem() {
    if (this.state.detailItem?.id === this.state.detailDialogItemId) {
      return this.state.detailItem;
    }

    return this.state.items.find((item) => item.id === this.state.detailDialogItemId);
  }

  setDetailItem(item) {
    if (!item) {
      return;
    }

    const imageCount = item.images?.length || 0;
    this.state.detailItem = item;
    this.state.detailDialogItemId = item.id;
    this.state.detailItemName = item.name;
    this.state.detailPhotoIndex = imageCount > 0
      ? Math.min(Math.max(0, this.state.detailPhotoIndex), imageCount - 1)
      : 0;
    this.state.items = this.state.items.map((candidate) => candidate.id === item.id ? item : candidate);
  }

  async refreshItems(options = {}) {
    if (options.resetPage) {
      this.state.page = 1;
    }

    this.state.loading = true;
    this.state.error = "";
    this.render();

    try {
      await this.loadItems();
    } catch (error) {
      this.state.error = error.message;
    } finally {
      this.state.loading = false;
      this.render();
    }
  }

  async applySearch() {
    this.state.query = this.state.searchText.trim();
    await this.refreshItems({ resetPage: true });
  }

  async clearSearch() {
    this.state.searchText = "";
    this.state.query = "";
    await this.refreshItems({ resetPage: true });
  }

  async changePage(page) {
    const nextPage = Math.min(Math.max(1, page), this.state.totalPages || 1);

    if (nextPage === this.state.page) {
      return;
    }

    this.state.page = nextPage;
    await this.refreshItems();
  }

  async createItem() {
    const name = this.state.itemName.trim();
    const cabinetId = this.state.itemCabinetId || this.state.selectedCabinetId;

    if (!name || !cabinetId) {
      this.state.error = "Select a cabinet and enter an item name.";
      this.render();
      return;
    }

    try {
      const photoCount = this.newItemFiles.length;

      if (photoCount > 0) {
        const formData = new FormData();
        formData.append("action", "create_item");
        formData.append("name", name);
        formData.append("cabinetId", cabinetId);
        this.newItemFiles.forEach((file) => formData.append("files", file));

        await this.request("/api/lovelace/", {
          method: "POST",
          body: formData,
        });
      } else {
        await this.request("/api/lovelace/", {
          method: "POST",
          body: JSON.stringify({
            action: "create_item",
            name,
            cabinetId,
          }),
        });
      }

      this.state.itemName = "";
      this.state.itemCabinetId = this.state.selectedCabinetId;
      this.newItemFiles = [];
      this.state.itemFilesLabel = "";
      this.state.addDialogOpen = false;
      this.state.message = photoCount > 0 ? `Added ${name} with ${photoCount} photo${photoCount === 1 ? "" : "s"}.` : `Added ${name}.`;
      await this.refreshItems({ resetPage: true });
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  openAddDialog() {
    this.state.addDialogOpen = true;
    this.state.itemCabinetId = this.state.selectedCabinetId;
    this.state.error = "";
    this.render();
  }

  closeAddDialog() {
    this.state.addDialogOpen = false;
    this.render();
  }

  openDetailDialog(item) {
    this.state.detailDialogItemId = item.id;
    this.state.detailItem = item;
    this.state.detailItemName = item.name;
    this.state.detailPhotoIndex = 0;
    this.state.error = "";
    this.render();
  }

  closeDetailDialog() {
    this.state.detailDialogItemId = "";
    this.state.detailItem = null;
    this.state.detailItemName = "";
    this.state.detailPhotoIndex = 0;
    this.render();
  }

  async addItemPhotos(item, files) {
    if (!files.length) {
      return;
    }

    const formData = new FormData();
    formData.append("action", "add_images");
    formData.append("itemId", item.id);
    files.forEach((file) => formData.append("files", file));

    try {
      const result = await this.request("/api/lovelace/", {
        method: "POST",
        body: formData,
      });
      const previousImageCount = item.images?.length || 0;
      if (result.item) {
        this.setDetailItem(result.item);
        this.state.detailPhotoIndex = previousImageCount;
      }
      this.state.message = `Added ${files.length} photo${files.length === 1 ? "" : "s"} to ${item.name}.`;
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async deleteItemPhoto(item, image) {
    if (!image || !window.confirm(`Remove photo from ${item.name}?`)) {
      return;
    }

    try {
      const result = await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "delete_image",
          imageId: image.id,
        }),
      });
      if (result.item) {
        this.setDetailItem(result.item);
      }
      this.state.message = `Removed photo from ${item.name}.`;
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async editItem(item) {
    const name = this.state.detailItemName.trim();

    if (!name || !name.trim()) {
      this.state.error = "Enter an item name.";
      this.render();
      return;
    }

    try {
      await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "update_item",
          id: item.id,
          name: name.trim(),
          cabinetId: item.cabinetId,
        }),
      });
      this.setDetailItem({
        ...item,
        name: name.trim(),
      });
      this.state.message = `Updated ${name.trim()}.`;
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async moveItem(item, cabinetId) {
    if (!cabinetId || cabinetId === item.cabinetId) {
      return;
    }

    const cabinet = this.state.cabinets.find((candidate) => candidate.id === cabinetId);
    const label = cabinet ? `${cabinet.room?.name || ""} > ${cabinet.name}` : "selected cabinet";

    try {
      await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "update_item",
          id: item.id,
          name: item.name,
          cabinetId,
        }),
      });
      this.setDetailItem({
        ...item,
        cabinetId,
        cabinet: cabinet ? {
          id: cabinet.id,
          name: cabinet.name,
          code: cabinet.code,
          room: cabinet.room,
        } : item.cabinet,
      });
      this.state.message = `Moved ${item.name} to ${label}.`;
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async deleteItem(item) {
    if (!window.confirm(`Delete ${item.name}?`)) {
      return;
    }

    try {
      await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "delete_item",
          id: item.id,
        }),
      });
      this.state.message = `Deleted ${item.name}.`;
      if (this.state.detailDialogItemId === item.id) {
        this.closeDetailDialog();
      }
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async loadJsQr() {
    if (window.jsQR) {
      return window.jsQR;
    }

    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = this.apiPath("/lovelace/jsQR.js");
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return window.jsQR;
  }

  async scanQrImage(file) {
    const jsQR = await this.loadJsQr();
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    try {
      const decoded = await new Promise((resolve) => {
        image.onload = () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d", { willReadFrequently: true });
          const maxSize = 1200;
          const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          resolve(code?.data || "");
        };
        image.onerror = () => resolve("");
        image.src = objectUrl;
      });
      const match = decoded.match(/^bjpkeep:cabinet:(.+)$/);

      if (!match) {
        this.state.error = decoded ? "QR is not a BJP Keep cabinet QR." : "No QR found in photo.";
        this.render();
        return;
      }

      const cabinetId = match[1];

      if (!this.state.cabinets.some((cabinet) => cabinet.id === cabinetId)) {
        const result = await this.request(`/api/lovelace/?resource=cabinet&id=${encodeURIComponent(cabinetId)}`);
        this.state.cabinets = [...this.state.cabinets, result.cabinet].sort((a, b) => {
          const roomA = a.room?.name || "";
          const roomB = b.room?.name || "";
          return `${roomA} ${a.code}`.localeCompare(`${roomB} ${b.code}`);
        });
      }

      this.state.selectedCabinetId = cabinetId;
      this.state.message = "Cabinet selected from QR.";
      await this.refreshItems({ resetPage: true });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  render() {
    if (!this.shadowRoot || !this.config) {
      return;
    }

    const selectedCabinet = this.selectedCabinet();
    const detailItem = this.selectedDetailItem();
    const detailImages = detailItem?.images || [];
    const detailImage = detailImages[this.state.detailPhotoIndex] || detailImages[0];
    const detailImageUrl = this.imageUrl(detailImage, { original: true });
    const totalItems = this.state.totalItems;
    const page = this.state.page;
    const totalPages = this.state.totalPages || 1;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 12px; overflow: hidden; }
        .stack { display: grid; gap: 10px; }
        .row { display: flex; gap: 8px; align-items: center; }
        .row > * { min-width: 0; }
        input, select, button, label.scan {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 8px 10px;
          font: inherit;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, #111);
        }
        button, label.scan {
          cursor: pointer;
          text-align: center;
          background: var(--primary-color, #03a9f4);
          color: var(--text-primary-color, white);
          border-color: transparent;
        }
        button.secondary {
          background: transparent;
          color: var(--primary-text-color, #111);
          border-color: var(--divider-color, #ddd);
        }
        button.icon {
          width: auto;
          min-width: 42px;
          padding-left: 12px;
          padding-right: 12px;
        }
        .search-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
        }
        .search-field {
          position: relative;
          min-width: 0;
        }
        .search-field input {
          padding-right: 82px;
        }
        .search-field .inline-search,
        .search-field .clear-inline {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          min-width: 34px;
          height: 34px;
          padding: 0;
          border-color: transparent;
          background: transparent;
          color: var(--secondary-text-color, #777);
          line-height: 1;
        }
        .search-field .inline-search {
          right: 4px;
        }
        .search-field .clear-inline {
          right: 40px;
        }
        .search-field .inline-search ha-icon {
          --mdc-icon-size: 18px;
          display: inline-flex;
          vertical-align: middle;
        }
        .search-field .inline-search:hover,
        .search-field .clear-inline:hover {
          background: var(--secondary-background-color, rgba(0, 0, 0, 0.04));
        }
        .item {
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 8px;
          display: grid;
          grid-template-columns: ${this.config.show_images ? "44px 1fr" : "1fr"};
          gap: 8px;
          align-items: center;
          cursor: pointer;
          text-align: left;
          background: transparent;
          color: inherit;
          width: 100%;
        }
        .item:hover { background: var(--secondary-background-color, rgba(0, 0, 0, 0.04)); }
        .thumb {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--secondary-background-color, #f3f3f3);
          display: grid;
          place-items: center;
          color: var(--secondary-text-color, #777);
          font-size: 18px;
        }
        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .item-body {
          min-width: 0;
          display: grid;
          gap: 2px;
        }
        .item-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 0.95em;
          line-height: 1.25;
        }
        .muted { color: var(--secondary-text-color, #777); font-size: 0.9em; }
        .location {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--secondary-text-color, #777);
          font-size: 0.82em;
        }
        .error { color: var(--error-color, #db4437); }
        .message { color: var(--success-color, #0f9d58); }
        .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .move { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
        .file-row {
          box-sizing: border-box;
          width: 100%;
          border: 1px dashed var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 10px;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          cursor: pointer;
          color: var(--secondary-text-color, #777);
        }
        .file-row span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .file-row strong {
          color: var(--primary-text-color, #111);
          font-weight: 600;
        }
        .pagination {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: center;
        }
        .page-label {
          text-align: center;
          color: var(--secondary-text-color, #777);
          font-size: 0.9em;
        }
        button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }
        .empty {
          border: 1px dashed var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 14px;
          color: var(--secondary-text-color, #777);
          text-align: center;
        }
        .toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 8px;
          align-items: center;
        }
        @media (max-width: 460px) {
          .toolbar {
            grid-template-columns: 1fr;
          }
          #openAdd {
            width: 100%;
          }
        }
        .dialog-backdrop {
          position: fixed;
          inset: 0;
          z-index: 10;
          display: grid;
          place-items: center;
          background: rgba(0, 0, 0, 0.45);
          padding: 16px;
        }
        .dialog {
          box-sizing: border-box;
          width: min(420px, 100%);
          border-radius: 12px;
          border: 1px solid var(--divider-color, #ddd);
          background: var(--card-background-color, white);
          color: var(--primary-text-color, #111);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.32);
          padding: 14px;
          display: grid;
          gap: 10px;
        }
        .dialog-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .dialog-title {
          font-weight: 600;
        }
        .dialog-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .detail-photo {
          width: 100%;
          aspect-ratio: 16 / 10;
          border-radius: 10px;
          overflow: hidden;
          background: var(--secondary-background-color, #f3f3f3);
          display: grid;
          place-items: center;
          color: var(--secondary-text-color, #777);
          font-size: 32px;
        }
        .detail-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .detail-gallery {
          display: grid;
          gap: 8px;
        }
        .detail-thumbs {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
          gap: 6px;
        }
        .detail-thumb {
          aspect-ratio: 1;
          min-width: 0;
          padding: 0;
          border-radius: 8px;
          overflow: hidden;
          background: var(--secondary-background-color, #f3f3f3);
          border-color: var(--divider-color, #ddd);
        }
        .detail-thumb.active {
          border-color: var(--primary-color, #03a9f4);
          box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color, #03a9f4) 28%, transparent);
        }
        .detail-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      </style>
      <ha-card header="${this.escape(this.config.title)}">
        <div class="stack">
          ${this.state.error ? `<div class="error">${this.state.error}</div>` : ""}
          ${this.state.message ? `<div class="message">${this.state.message}</div>` : ""}
          <label class="scan">
            📷 Scan Cabinet QR
            <input type="file" accept="image/*" capture="environment" id="scan" hidden>
          </label>
          <select id="cabinet">
            <option value="" ${!this.state.selectedCabinetId ? "selected" : ""}>All cabinets</option>
            ${this.state.cabinets.map((cabinet) => `
              <option value="${cabinet.id}" ${cabinet.id === this.state.selectedCabinetId ? "selected" : ""}>
                ${this.escape(cabinet.room?.name || "")} > ${this.escape(cabinet.name)} (${this.escape(cabinet.code)})
              </option>
            `).join("")}
          </select>
          <div class="toolbar">
            <div class="search-row">
              <div class="search-field">
                <input id="search" placeholder="Search items" value="${this.escape(this.state.searchText)}">
                <button id="clearSearch" class="secondary icon clear-inline" title="Clear search" ${this.state.searchText || this.state.query ? "" : "disabled"}>×</button>
                <button id="applySearch" class="secondary icon inline-search" title="Search" aria-label="Search">
                  <ha-icon icon="mdi:magnify"></ha-icon>
                </button>
              </div>
              <button id="refresh" class="secondary icon" title="Refresh">↻</button>
            </div>
            <button id="openAdd" style="width:auto; white-space:nowrap;">Add item</button>
          </div>
          <div class="muted">
            ${selectedCabinet ? `${this.escape(selectedCabinet.name)} (${this.escape(selectedCabinet.code)})` : "All cabinets"}
            · ${totalItems} item${totalItems === 1 ? "" : "s"}
            · Page ${page} of ${totalPages}
            ${this.state.loading ? " · Loading..." : ""}
          </div>
          ${this.state.items.length ? this.state.items.map((item) => {
            const imageUrl = this.itemImageUrl(item);

            return `
            <button class="item" data-open-detail="${item.id}">
              ${this.config.show_images ? `
                <div class="thumb">
                  ${imageUrl ? `<img src="${this.escape(imageUrl)}" alt="${this.escape(item.name)}" loading="lazy">` : "📦"}
                </div>
              ` : ""}
              <div class="item-body">
                <div class="item-title"><strong>${this.escape(item.name)}</strong></div>
                <div class="location">${this.escape(item.cabinet?.room?.name || "")} > ${this.escape(item.cabinet?.name || item.cabinet?.code || "")}</div>
              </div>
            </button>
          `;
          }).join("") : `<div class="empty">${this.state.loading ? "Loading items..." : "No items found."}</div>`}
          <div class="pagination">
            <button id="prevPage" class="secondary" ${page <= 1 || this.state.loading ? "disabled" : ""}>Previous</button>
            <div class="page-label">${page} / ${totalPages}</div>
            <button id="nextPage" class="secondary" ${page >= totalPages || this.state.loading ? "disabled" : ""}>Next</button>
          </div>
        </div>
        ${this.state.addDialogOpen ? `
          <div class="dialog-backdrop" id="addBackdrop">
            <div class="dialog" role="dialog" aria-modal="true" aria-label="Add item">
              <div class="dialog-head">
                <div class="dialog-title">Add item</div>
                <button id="closeAdd" class="secondary icon" title="Close">×</button>
              </div>
              <input id="itemName" placeholder="New item name" value="${this.escape(this.state.itemName)}">
              <select id="itemCabinet">
                <option value="" ${!this.state.itemCabinetId ? "selected" : ""}>Select cabinet</option>
                ${this.state.cabinets.map((cabinet) => `
                  <option value="${cabinet.id}" ${cabinet.id === this.state.itemCabinetId ? "selected" : ""}>
                    ${this.escape(cabinet.room?.name || "")} > ${this.escape(cabinet.name)} (${this.escape(cabinet.code)})
                  </option>
                `).join("")}
              </select>
              <label class="file-row">
                <span>${this.escape(this.state.itemFilesLabel || "Choose photos...")}</span>
                <strong>Browse</strong>
                <input type="file" accept="image/*" multiple id="itemFiles" hidden>
              </label>
              <div class="muted">
                ${this.state.itemCabinetId
                  ? "Item will be added to the selected cabinet."
                  : "Choose a cabinet before saving."}
              </div>
              <div class="dialog-actions">
                <button id="cancelAdd" class="secondary">Cancel</button>
                <button id="add" ${!this.state.itemCabinetId || this.state.loading ? "disabled" : ""}>Save</button>
              </div>
            </div>
          </div>
        ` : ""}
        ${detailItem ? `
          <div class="dialog-backdrop" id="detailBackdrop">
            <div class="dialog" role="dialog" aria-modal="true" aria-label="Item detail">
              <div class="dialog-head">
                <div class="dialog-title">Item detail</div>
                <button id="closeDetail" class="secondary icon" title="Close">×</button>
              </div>
              <div class="detail-gallery">
                <div class="detail-photo">
                  ${detailImageUrl ? `<img src="${this.escape(detailImageUrl)}" alt="${this.escape(detailItem.name)}">` : "📦"}
                </div>
                ${detailImages.length > 1 ? `
                  <div class="detail-thumbs" aria-label="Item photos">
                    ${detailImages.map((image, index) => `
                      <button class="secondary detail-thumb ${index === this.state.detailPhotoIndex ? "active" : ""}" data-detail-photo-index="${index}" title="Photo ${index + 1}">
                        <img src="${this.escape(this.imageUrl(image))}" alt="${this.escape(detailItem.name)} photo ${index + 1}" loading="lazy">
                      </button>
                    `).join("")}
                  </div>
                ` : ""}
              </div>
              <input id="detailItemName" placeholder="Item name" value="${this.escape(this.state.detailItemName)}">
              <div class="muted">
                ${this.escape(detailItem.cabinet?.room?.name || "")} > ${this.escape(detailItem.cabinet?.name || detailItem.cabinet?.code || "")}
              </div>
              <div class="move">
                <select id="detailMoveCabinet">
                  ${this.state.cabinets.map((cabinet) => `
                    <option value="${cabinet.id}" ${cabinet.id === detailItem.cabinetId ? "selected" : ""}>
                      ${this.escape(cabinet.room?.name || "")} > ${this.escape(cabinet.name)} (${this.escape(cabinet.code)})
                    </option>
                  `).join("")}
                </select>
                <button id="detailMove" class="secondary" style="width:auto;">Move</button>
              </div>
              <div class="actions">
                <label class="scan">
                  Add Photo
                  <input type="file" accept="image/*" multiple id="detailPhoto" hidden>
                </label>
                <button id="detailDeletePhoto" class="secondary" ${detailImage ? "" : "disabled"}>Remove Photo</button>
              </div>
              <div class="dialog-actions">
                <button id="detailDelete" class="secondary">Delete</button>
                <button id="detailSave">Save</button>
              </div>
            </div>
          </div>
        ` : ""}
      </ha-card>
    `;

    this.shadowRoot.getElementById("cabinet")?.addEventListener("change", (event) => {
      this.state.selectedCabinetId = event.target.value;
      this.refreshItems({ resetPage: true });
    });
    this.shadowRoot.getElementById("search")?.addEventListener("input", (event) => {
      this.state.searchText = event.target.value;
    });
    this.shadowRoot.getElementById("search")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.applySearch();
      }
    });
    this.shadowRoot.getElementById("applySearch")?.addEventListener("click", () => {
      this.applySearch();
    });
    this.shadowRoot.getElementById("clearSearch")?.addEventListener("click", () => {
      this.clearSearch();
    });
    this.shadowRoot.getElementById("refresh")?.addEventListener("click", () => this.refreshItems());
    this.shadowRoot.getElementById("openAdd")?.addEventListener("click", () => this.openAddDialog());
    this.shadowRoot.getElementById("closeAdd")?.addEventListener("click", () => this.closeAddDialog());
    this.shadowRoot.getElementById("cancelAdd")?.addEventListener("click", () => this.closeAddDialog());
    this.shadowRoot.getElementById("addBackdrop")?.addEventListener("click", (event) => {
      if (event.target?.id === "addBackdrop") {
        this.closeAddDialog();
      }
    });
    this.shadowRoot.getElementById("closeDetail")?.addEventListener("click", () => this.closeDetailDialog());
    this.shadowRoot.getElementById("detailBackdrop")?.addEventListener("click", (event) => {
      if (event.target?.id === "detailBackdrop") {
        this.closeDetailDialog();
      }
    });
    this.shadowRoot.getElementById("prevPage")?.addEventListener("click", () => {
      this.changePage(this.state.page - 1);
    });
    this.shadowRoot.getElementById("nextPage")?.addEventListener("click", () => {
      this.changePage(this.state.page + 1);
    });
    this.shadowRoot.getElementById("itemName")?.addEventListener("input", (event) => {
      this.state.itemName = event.target.value;
    });
    this.shadowRoot.getElementById("itemName")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.createItem();
      }
    });
    this.shadowRoot.getElementById("itemCabinet")?.addEventListener("change", (event) => {
      this.state.itemCabinetId = event.target.value;
      this.render();
    });
    this.shadowRoot.getElementById("itemFiles")?.addEventListener("change", (event) => {
      this.newItemFiles = Array.from(event.target.files || []);
      this.state.itemFilesLabel = this.newItemFiles.length > 0
        ? `${this.newItemFiles.length} photo${this.newItemFiles.length === 1 ? "" : "s"} selected`
        : "";
      this.render();
    });
    this.shadowRoot.getElementById("add")?.addEventListener("click", () => this.createItem());
    this.shadowRoot.getElementById("detailItemName")?.addEventListener("input", (event) => {
      this.state.detailItemName = event.target.value;
    });
    this.shadowRoot.getElementById("detailItemName")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        const item = this.selectedDetailItem();
        if (item) {
          this.editItem(item);
        }
      }
    });
    this.shadowRoot.getElementById("detailSave")?.addEventListener("click", () => {
      const item = this.selectedDetailItem();
      if (item) {
        this.editItem(item);
      }
    });
    this.shadowRoot.getElementById("detailMove")?.addEventListener("click", () => {
      const item = this.selectedDetailItem();
      const cabinetSelect = this.shadowRoot.getElementById("detailMoveCabinet");
      if (item && cabinetSelect) {
        this.moveItem(item, cabinetSelect.value);
      }
    });
    this.shadowRoot.getElementById("detailPhoto")?.addEventListener("change", (event) => {
      const item = this.selectedDetailItem();
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      if (item) {
        this.addItemPhotos(item, files);
      }
    });
    this.shadowRoot.getElementById("detailDeletePhoto")?.addEventListener("click", () => {
      const item = this.selectedDetailItem();
      const image = item?.images?.[this.state.detailPhotoIndex] || item?.images?.[0];
      if (item && image) {
        this.deleteItemPhoto(item, image);
      }
    });
    this.shadowRoot.getElementById("detailDelete")?.addEventListener("click", () => {
      const item = this.selectedDetailItem();
      if (item) {
        this.deleteItem(item);
      }
    });
    this.shadowRoot.getElementById("scan")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) {
        this.scanQrImage(file);
      }
    });
    this.shadowRoot.querySelectorAll("[data-open-detail]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.state.items.find((candidate) => candidate.id === button.dataset.openDetail);
        if (item) {
          this.openDetailDialog(item);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-detail-photo-index]").forEach((button) => {
      button.addEventListener("click", () => {
        this.state.detailPhotoIndex = Number(button.dataset.detailPhotoIndex || 0);
        this.render();
      });
    });
  }

  escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

class BjpKeepCardEditor extends HTMLElement {
  setConfig(config) {
    this.config = {
      api_url: "",
      api_token: "",
      title: "BJP Keep",
      page_size: 10,
      show_images: true,
      ...config,
    };

    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  updateConfig(patch) {
    const nextConfig = {
      ...this.config,
      ...patch,
    };

    if (!nextConfig.cabinet_id) {
      delete nextConfig.cabinet_id;
    }

    if (!nextConfig.actor || nextConfig.actor === BJPKEEP_DEFAULT_ACTOR) {
      delete nextConfig.actor;
    }

    if (nextConfig.api_url) {
      nextConfig.api_url = String(nextConfig.api_url).replace(/\/+$/, "");
    }

    this.config = nextConfig;
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: {
        config: nextConfig,
      },
    }));
    this.render();
  }

  render() {
    if (!this.shadowRoot || !this.config) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .editor {
          display: grid;
          gap: 14px;
        }
        label {
          display: grid;
          gap: 6px;
          color: var(--primary-text-color, #111);
          font: inherit;
        }
        .label {
          font-size: 0.9em;
          color: var(--secondary-text-color, #777);
        }
        input {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 10px;
          font: inherit;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, #111);
        }
        .check {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .check input {
          width: auto;
        }
        .hint {
          color: var(--secondary-text-color, #777);
          font-size: 0.85em;
          line-height: 1.4;
        }
      </style>
      <div class="editor">
        <label>
          <span class="label">API URL</span>
          <input id="api_url" value="${this.escape(this.config.api_url)}" placeholder="http://192.168.1.222:3000">
          <span class="hint">Use the exposed add-on port, not the Home Assistant Ingress URL.</span>
        </label>
        <label>
          <span class="label">API Token</span>
          <input id="api_token" type="password" value="${this.escape(this.config.api_token)}" placeholder="same value as lovelace_token">
        </label>
        <label>
          <span class="label">Title</span>
          <input id="title" value="${this.escape(this.config.title)}" placeholder="BJP Keep">
        </label>
        <label>
          <span class="label">Page Size</span>
          <input id="page_size" type="number" min="1" max="50" value="${Number(this.config.page_size || 10)}">
        </label>
        <label class="check">
          <input id="show_images" type="checkbox" ${this.config.show_images !== false ? "checked" : ""}>
          <span>Show item thumbnails</span>
        </label>
      </div>
    `;

    this.shadowRoot.getElementById("api_url")?.addEventListener("change", (event) => {
      this.updateConfig({ api_url: event.target.value.trim() });
    });
    this.shadowRoot.getElementById("api_token")?.addEventListener("change", (event) => {
      this.updateConfig({ api_token: event.target.value });
    });
    this.shadowRoot.getElementById("title")?.addEventListener("change", (event) => {
      this.updateConfig({ title: event.target.value || "BJP Keep" });
    });
    this.shadowRoot.getElementById("page_size")?.addEventListener("change", (event) => {
      const pageSize = Math.min(Math.max(Number(event.target.value) || 10, 1), 50);
      this.updateConfig({ page_size: pageSize });
    });
    this.shadowRoot.getElementById("show_images")?.addEventListener("change", (event) => {
      this.updateConfig({ show_images: event.target.checked });
    });
  }

  escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

if (!customElements.get("bjpkeep-card-editor")) {
  customElements.define("bjpkeep-card-editor", BjpKeepCardEditor);
}

if (!customElements.get("bjpkeep-card")) {
  customElements.define("bjpkeep-card", BjpKeepCard);
}

window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === "bjpkeep-card")) {
  window.customCards.push({
    type: "bjpkeep-card",
    name: "BJP Keep",
    description: "Inventory search, QR cabinet selection, compact item list, and item creation.",
    preview: true,
  });
}
