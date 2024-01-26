import { Project } from '../core/workspace-utils';

export interface IPlugin {
  /**
   * Initialize the plugin for the current project
   * @param project The project instance
   * @returns A boolean indicating of the plugin is valid for the current project
   */
  initialize(project: Project): Promise<boolean>;
}

export class PluginManager<T extends IPlugin> {
  plugins: T[] = [];
  availablePlugins: T[] = [];

  constructor(private defaultPlugin: T) {

  }

  async initialize(project: Project): Promise<T> {
    const plugins = this.plugins.map(async plugin => {
      if (await plugin.initialize(project)) {
        return plugin;
      }
      return null;
    });

    const result = await Promise.all(plugins);
    this.availablePlugins = result.filter((t): t is Awaited<T> => !!t);

    if (this.availablePlugins.length > 0) {
      return this.availablePlugins[this.availablePlugins.length - 1];
    }
    return this.defaultPlugin;
  }

  register(plugin: T) {
    this.plugins.push(plugin);
  }
}
