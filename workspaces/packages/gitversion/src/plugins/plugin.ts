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
    const plugins = this.plugins.filter(async plugin => await plugin.initialize(project));
    const result = await Promise.all(plugins);
    this.availablePlugins = result;

    if (plugins.length > 0) {
      return plugins[plugins.length - 1];
    }
    return this.defaultPlugin;
  }

  register(plugin: T) {
    this.plugins.push(plugin);
  }
}
