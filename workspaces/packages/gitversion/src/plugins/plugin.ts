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

  async initialize(project: Project) {
    const plugins = this.plugins.filter(async plugin => plugin.initialize(project));
    const result = await Promise.all(plugins);
    this.availablePlugins = result;
  }

  register(plugin: T) {
    this.plugins.push(plugin);
  }
}
