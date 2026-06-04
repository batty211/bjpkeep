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
      actor: "Dashboard",
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
      actor: "Lovelace",
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
      page: 1,
      pageSize: Number(config.page_size || 10),
      totalItems: 0,
      totalPages: 1,
      itemFilesLabel: "",
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
    return 5;
  }

  apiPath(path) {
    return `${this.config.api_url}${path}`;
  }

  itemImageUrl(item) {
    const image = item.images?.[0];
    const path = image?.thumbnailPath || image?.path;

    if (!path) {
      return "";
    }

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    return this.apiPath(path.startsWith("/") ? path : `/${path}`);
  }

  headers() {
    return {
      Authorization: `Bearer ${this.config.api_token}`,
      "Content-Type": "application/json",
      "X-BJPKeep-Actor": this.config.actor,
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

    if (!name || !this.state.selectedCabinetId) {
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
        formData.append("cabinetId", this.state.selectedCabinetId);
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
            cabinetId: this.state.selectedCabinetId,
          }),
        });
      }

      this.state.itemName = "";
      this.newItemFiles = [];
      this.state.itemFilesLabel = "";
      this.state.message = photoCount > 0 ? `Added ${name} with ${photoCount} photo${photoCount === 1 ? "" : "s"}.` : `Added ${name}.`;
      await this.refreshItems({ resetPage: true });
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
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
      await this.request("/api/lovelace/", {
        method: "POST",
        body: formData,
      });
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
      await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "delete_image",
          imageId: image.id,
        }),
      });
      this.state.message = `Removed photo from ${item.name}.`;
      await this.refreshItems();
    } catch (error) {
      this.state.error = error.message;
      this.render();
    }
  }

  async editItem(item) {
    const name = window.prompt("Item name", item.name);

    if (!name || !name.trim()) {
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
    const totalItems = this.state.totalItems;
    const page = this.state.page;
    const totalPages = this.state.totalPages || 1;
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; overflow: hidden; }
        .stack { display: grid; gap: 12px; }
        .row { display: flex; gap: 8px; align-items: center; }
        .row > * { min-width: 0; }
        input, select, button, label.scan {
          box-sizing: border-box;
          width: 100%;
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 10px;
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
        .item {
          border: 1px solid var(--divider-color, #ddd);
          border-radius: 8px;
          padding: 10px;
          display: grid;
          grid-template-columns: ${this.config.show_images ? "56px 1fr" : "1fr"};
          gap: 10px;
          align-items: start;
        }
        .thumb {
          width: 56px;
          height: 56px;
          border-radius: 8px;
          overflow: hidden;
          background: var(--secondary-background-color, #f3f3f3);
          display: grid;
          place-items: center;
          color: var(--secondary-text-color, #777);
          font-size: 22px;
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
          gap: 6px;
        }
        .item-title {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .muted { color: var(--secondary-text-color, #777); font-size: 0.9em; }
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
          <div class="row">
            <input id="search" placeholder="Search items" value="${this.escape(this.state.searchText)}">
            <button id="applySearch" class="secondary" style="width:auto; white-space:nowrap;">Search</button>
            <button id="clearSearch" class="secondary icon" title="Clear search">×</button>
            <button id="refresh" class="secondary icon" title="Refresh">↻</button>
          </div>
          <div class="row">
            <input id="itemName" placeholder="New item name" value="${this.escape(this.state.itemName)}">
            <button id="add" style="width:auto; white-space:nowrap;">Add</button>
          </div>
          <label class="file-row">
            <span>${this.escape(this.state.itemFilesLabel || "Choose photos for new item...")}</span>
            <strong>Browse</strong>
            <input type="file" accept="image/*" multiple id="itemFiles" hidden>
          </label>
          <div class="muted">
            ${selectedCabinet ? `${this.escape(selectedCabinet.name)} (${this.escape(selectedCabinet.code)})` : "All cabinets"}
            · ${totalItems} item${totalItems === 1 ? "" : "s"}
            · Page ${page} of ${totalPages}
            ${this.state.loading ? " · Loading..." : ""}
          </div>
          ${this.state.items.length ? this.state.items.map((item) => {
            const imageUrl = this.itemImageUrl(item);
            const image = item.images?.[0];

            return `
            <div class="item">
              ${this.config.show_images ? `
                <div class="thumb">
                  ${imageUrl ? `<img src="${this.escape(imageUrl)}" alt="${this.escape(item.name)}" loading="lazy">` : "📦"}
                </div>
              ` : ""}
              <div class="item-body">
                <div class="item-title"><strong>${this.escape(item.name)}</strong></div>
                <div class="muted">${this.escape(item.cabinet?.room?.name || "")} > ${this.escape(item.cabinet?.code || "")}</div>
                <div class="move">
                  <select data-move-cabinet="${item.id}">
                    ${this.state.cabinets.map((cabinet) => `
                      <option value="${cabinet.id}" ${cabinet.id === item.cabinetId ? "selected" : ""}>
                        ${this.escape(cabinet.room?.name || "")} > ${this.escape(cabinet.name)} (${this.escape(cabinet.code)})
                      </option>
                    `).join("")}
                  </select>
                  <button class="secondary" data-move="${item.id}" style="width:auto;">Move</button>
                </div>
                <div class="actions">
                  <button class="secondary" data-edit="${item.id}">Edit</button>
                  <button class="secondary" data-delete="${item.id}">Delete</button>
                </div>
                <div class="actions">
                  <label class="scan" data-photo-label="${item.id}">
                    Add Photo
                    <input type="file" accept="image/*" multiple data-photo="${item.id}" hidden>
                  </label>
                  <button class="secondary" data-delete-photo="${item.id}" ${image ? "" : "disabled"}>Remove Photo</button>
                </div>
              </div>
            </div>
          `;
          }).join("") : `<div class="empty">${this.state.loading ? "Loading items..." : "No items found."}</div>`}
          <div class="pagination">
            <button id="prevPage" class="secondary" ${page <= 1 || this.state.loading ? "disabled" : ""}>Previous</button>
            <div class="page-label">${page} / ${totalPages}</div>
            <button id="nextPage" class="secondary" ${page >= totalPages || this.state.loading ? "disabled" : ""}>Next</button>
          </div>
        </div>
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
    this.shadowRoot.getElementById("itemFiles")?.addEventListener("change", (event) => {
      this.newItemFiles = Array.from(event.target.files || []);
      this.state.itemFilesLabel = this.newItemFiles.length > 0
        ? `${this.newItemFiles.length} photo${this.newItemFiles.length === 1 ? "" : "s"} selected`
        : "";
      this.render();
    });
    this.shadowRoot.getElementById("add")?.addEventListener("click", () => this.createItem());
    this.shadowRoot.getElementById("scan")?.addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) {
        this.scanQrImage(file);
      }
    });
    this.shadowRoot.querySelectorAll("[data-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.state.items.find((candidate) => candidate.id === button.dataset.edit);
        if (item) {
          this.editItem(item);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.state.items.find((candidate) => candidate.id === button.dataset.delete);
        if (item) {
          this.deleteItem(item);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-move]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.state.items.find((candidate) => candidate.id === button.dataset.move);
        const cabinetSelect = this.shadowRoot.querySelector(`[data-move-cabinet="${button.dataset.move}"]`);
        if (item && cabinetSelect) {
          this.moveItem(item, cabinetSelect.value);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-photo]").forEach((input) => {
      input.addEventListener("change", (event) => {
        const item = this.state.items.find((candidate) => candidate.id === input.dataset.photo);
        const files = Array.from(event.target.files || []);
        event.target.value = "";
        if (item) {
          this.addItemPhotos(item, files);
        }
      });
    });
    this.shadowRoot.querySelectorAll("[data-delete-photo]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = this.state.items.find((candidate) => candidate.id === button.dataset.deletePhoto);
        const image = item?.images?.[0];
        if (item && image) {
          this.deleteItemPhoto(item, image);
        }
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
      actor: "Dashboard",
      title: "BJP Keep",
      page_size: 10,
      show_images: true,
      cabinet_id: "",
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
          <span class="label">Actor</span>
          <input id="actor" value="${this.escape(this.config.actor)}" placeholder="Dashboard">
        </label>
        <label>
          <span class="label">Cabinet ID</span>
          <input id="cabinet_id" value="${this.escape(this.config.cabinet_id || "")}" placeholder="Optional: lock this card to one cabinet">
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
    this.shadowRoot.getElementById("actor")?.addEventListener("change", (event) => {
      this.updateConfig({ actor: event.target.value || "Dashboard" });
    });
    this.shadowRoot.getElementById("cabinet_id")?.addEventListener("change", (event) => {
      this.updateConfig({ cabinet_id: event.target.value.trim() });
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
