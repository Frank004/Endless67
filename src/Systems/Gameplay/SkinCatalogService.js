class SkinCatalogService {
    constructor() {
        this._catalog = null;
        this._loading = null;
    }

    async load() {
        if (this._catalog) return this._catalog;
        if (this._loading) return this._loading;

        const v = window.GAME_VERSION ? `?v=${window.GAME_VERSION}` : '';
        this._loading = fetch(`./assets/skins/skins.json${v}`)
            .then(async (res) => {
                if (!res.ok) throw new Error(`Failed to load skins.json (${res.status})`);
                const data = await res.json();
                this._catalog = data;
                return data;
            })
            .catch((err) => {
                console.warn('[SkinCatalogService] Failed to load catalog:', err);
                this._catalog = { version: 1, skins: [] };
                return this._catalog;
            })
            .finally(() => {
                this._loading = null;
            });

        return this._loading;
    }

    getAllSkins() {
        return this._catalog?.skins || [];
    }

    getSkinById(id) {
        if (!id) return null;
        return this.getAllSkins().find((skin) => skin.id === id) || null;
    }
}

export default new SkinCatalogService();
