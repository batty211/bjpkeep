class BjpKeepCard extends HTMLElement {
  setConfig(config) {
    if (!config.api_url) {
      throw new Error("api_url is required");
    }

    this.config = {
      api_token: "",
      actor: "Lovelace",
      title: "BJP Keep",
      show_images: true,
      ...config,
      api_url: String(config.api_url).replace(/\/+$/, ""),
    };
    this.state = {
      cabinets: [],
      items: [],
      selectedCabinetId: config.cabinet_id || "",
      query: "",
      itemName: "",
      loading: false,
      error: "",
      message: "",
    };
    this.attachShadow({ mode: "open" });
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
    const response = await fetch(this.apiPath(path), {
      ...options,
      headers: {
        ...this.headers(),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "BJP Keep request failed");
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
      const cabinetsResult = await this.request("/api/lovelace/?resource=cabinets");
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
    const params = new URLSearchParams({ resource: "items" });

    if (this.state.selectedCabinetId) {
      params.set("cabinetId", this.state.selectedCabinetId);
    }

    if (this.state.query.trim()) {
      params.set("q", this.state.query.trim());
    }

    const result = await this.request(`/api/lovelace/?${params.toString()}`);
    this.state.items = result.items || [];
  }

  selectedCabinet() {
    return this.state.cabinets.find((cabinet) => cabinet.id === this.state.selectedCabinetId);
  }

  async refreshItems() {
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

  async createItem() {
    const name = this.state.itemName.trim();

    if (!name || !this.state.selectedCabinetId) {
      this.state.error = "Select a cabinet and enter an item name.";
      this.render();
      return;
    }

    try {
      await this.request("/api/lovelace/", {
        method: "POST",
        body: JSON.stringify({
          action: "create_item",
          name,
          cabinetId: this.state.selectedCabinetId,
        }),
      });
      this.state.itemName = "";
      this.state.message = `Added ${name}.`;
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
      await this.refreshItems();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  render() {
    if (!this.shadowRoot || !this.config) {
      return;
    }

    const selectedCabinet = this.selectedCabinet();
    const totalItems = this.state.items.length;
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
            <input id="search" placeholder="Search items" value="${this.escape(this.state.query)}">
            <button id="clearSearch" class="secondary icon" title="Clear search">×</button>
            <button id="refresh" class="secondary icon" title="Refresh">↻</button>
          </div>
          <div class="row">
            <input id="itemName" placeholder="New item name" value="${this.escape(this.state.itemName)}">
            <button id="add" style="width:auto; white-space:nowrap;">Add</button>
          </div>
          <div class="muted">
            ${selectedCabinet ? `${this.escape(selectedCabinet.name)} (${this.escape(selectedCabinet.code)})` : "All cabinets"}
            · ${totalItems} item${totalItems === 1 ? "" : "s"}
            ${this.state.loading ? " · Loading..." : ""}
          </div>
          ${this.state.items.length ? this.state.items.map((item) => {
            const imageUrl = this.itemImageUrl(item);

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
              </div>
            </div>
          `;
          }).join("") : `<div class="empty">${this.state.loading ? "Loading items..." : "No items found."}</div>`}
        </div>
      </ha-card>
    `;

    this.shadowRoot.getElementById("cabinet")?.addEventListener("change", (event) => {
      this.state.selectedCabinetId = event.target.value;
      this.refreshItems();
    });
    this.shadowRoot.getElementById("search")?.addEventListener("input", (event) => {
      this.state.query = event.target.value;
      window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => this.refreshItems(), 250);
    });
    this.shadowRoot.getElementById("clearSearch")?.addEventListener("click", () => {
      this.state.query = "";
      this.refreshItems();
    });
    this.shadowRoot.getElementById("refresh")?.addEventListener("click", () => this.refreshItems());
    this.shadowRoot.getElementById("itemName")?.addEventListener("input", (event) => {
      this.state.itemName = event.target.value;
    });
    this.shadowRoot.getElementById("itemName")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        this.createItem();
      }
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
  }

  escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

customElements.define("bjpkeep-card", BjpKeepCard);
