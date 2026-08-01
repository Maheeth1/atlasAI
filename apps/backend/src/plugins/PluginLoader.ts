import { Plugin } from "./Plugin";
import { Events } from "../events/events";
import { eventBus } from "../events/eventBus";

export class PluginLoader {
    private plugins = new Map<string, Plugin>();

    async load(plugin: Plugin) {
        await plugin.init();

        this.plugins.set(plugin.name, plugin);

        eventBus.emit(Events.PLUGIN_LOADED, plugin);
    }

    async unload(name: string) {
        const plugin = this.plugins.get(name);

        if (!plugin) return;

        await plugin.dispose();

        this.plugins.delete(name);

        eventBus.emit(Events.PLUGIN_UNLOADED, plugin);
    }

    getPlugins() {
        return [...this.plugins.values()];
    }
}

export const pluginLoader = new PluginLoader();