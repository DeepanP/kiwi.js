/**
* 
* @module Kiwi
* 
*/

module Kiwi {

    /**
    * 
    * @class PluginManager
    * @namespace Kiwi
    * @constructor
    * @param game {Game} The state that this entity belongs to. Used to generate the Unique ID and for garbage collection.
    * @param plugins {string[]} The entities position on the x axis.
    * @return {PluginManager} This PluginManager.
    *
    */
    export class PluginManager {

        constructor(game: Kiwi.Game,plugins:string[]) {
            console.log("creating PluginManager");
            this._game = game;
            this._plugins = plugins || new Array();
            this._bootObjects = new Array();
            this.validatePlugins();
            this._createPlugins();
        }

        /**
        * An array of plugins which have been included in the webpage and registered successfully.
        * @property _availablePlugins
        * @type Array
        * @static
        * @private
        */
        private static _availablePlugins = new Array();
        

        /**
        * An array of objects represetning all available plugins, each containing the name and version number of an available plugin
        * @property getAvailablePlugins
        * @type Array
        * @static
        * @private
        */
        public static get availablePlugins():any {
            var plugins = [];
            for (var i = 0; i < PluginManager._availablePlugins.length; i++) {
                plugins.push({
                    name: PluginManager._availablePlugins[i].name, version: PluginManager._availablePlugins[i].version});
            }
            return plugins;
        }

        /**
        * Registers a plugin object as available. Any game instance can choose to use the plugin.
        * Plugins need only be registered once per webpage. If registered a second time it will be ignored.
        * Two plugins with the same names cannot be reigstered simultaneously, even if different versions.
        * @method register
        * @param {object} plugin
        * @public
        * @static
        */
        public static register(plugin: any) {
            console.log("Attempting to register plugin :" + plugin.name);
            if (this._availablePlugins.indexOf(plugin) == -1) {
                //check if plugin with same name is registered
                var uniqueName: boolean = true;
                for (var i = 0; i < this._availablePlugins.length; i++) {
                    if (plugin.name === this._availablePlugins[i].name) {
                        uniqueName = false;
                    }
                }

                if (uniqueName) {
                    this._availablePlugins.push(plugin);
                    console.log("Registered plugin " + plugin.name + ": version " + plugin.version);
                } else {
                    console.log("A plugin with the same name has already been registered. Ignoring this plugin.");
                
                }
            } else {
                console.log("This plugin has already been registered. Ignoring second registration.");
            }
        }

        /**
        * Identifies the object as a PluginManager. 
        * @property objType
        * @type string
        * @public
        */       
        public get objType(): string {
            return "PluginManager";
        }

        /**
        * A reference to the game instance that owns the PluginManager. 
        * @property objType
        * @type Kiwi.Game
        * @private
        */
        private _game: Kiwi.Game;

        /**
        * An array of plugin names which the game instance has been configured to use. Each name must match the constructor function for the plugin. 
        * @property _plugins
        * @type string[]
        * @private
        */
        private _plugins: string[];
        
        /**
        * An array of objects that contain a boot function, each of which will be called when PluginManager.boot is invoked. 
        * @property _bootObjects
        * @type Array
        * @private
        */
        private _bootObjects: any[];

        /**
        * Builds a list of valid plugins used by the game instance. Each plugin name that is supplied in the Kiwi.Game constructor configuration object  
        * is checked against the Kiwi.Plugins namespace to ensure that a property of the same name exists.
        * This will ignore plugin that are registered but not used by the game instance.
        * @method validatePlugins
        * @public
        */
        public validatePlugins() {
            var validPlugins: string[] = new Array();

            for (var i = 0; i < this._plugins.length; i++) {
                var plugin: any = this._plugins[i];
                if (typeof plugin == 'string' || plugin instanceof String) {
                    if (Kiwi.Plugins.hasOwnProperty(plugin) && this.pluginIsRegistered(plugin)) {
                        validPlugins.push(plugin);
                        console.log("Plugin '" + plugin + "' appears to be valid.");
                        console.log("Name:" + Kiwi.Plugins[plugin].name);
                        console.log("Version:" + Kiwi.Plugins[plugin].version);
                    } else {
                        console.log("Plugin '" + plugin + "' appears to be invalid. No property with that name exists on the Kiwi.Plugins object or the Plugin is not registered. Check that the js file containing the plugin has been included. This plugin will be ignored");
                    }
                } else {
                    console.log("The supplied plugin name at index " + i + "is not a string and will be ignored"); 
                }
            }
            this._plugins = validPlugins;
        }

        /**
        * Returns true if a plugin identified by the supplied pluginName is registered.
        * @method pluginIsRegistered
        * @param {string} pluginName
        * @public
        */

        public pluginIsRegistered(pluginName: string):boolean {
            var isRegistered: boolean = false;
            for (var i = 0; i < Kiwi.PluginManager._availablePlugins.length; i++) {
                if (Kiwi.PluginManager._availablePlugins[i].name === pluginName) {
                    isRegistered = true;
                }
            }
            return isRegistered;
        }

        /**
        * Called after all other core objects and services created by the Kiwi.Game constructor are created.
        * Attempts to find a "create" function on each plugin and calls it if it exists.
        * The create function may return an object on which a boot function exists - to be called during boot process.
        * @method _createPlugins
        * @private
        */
        private _createPlugins() {
            for (var i = 0; i < this._plugins.length; i++) {
                var plugin: string = this._plugins[i];
                if (Kiwi.Plugins[plugin].hasOwnProperty("create")) {
                    console.log("'Create' function found on plugin '" + plugin + "'");
                    var bootObject = Kiwi.Plugins[plugin].create(this._game);
                    if (bootObject) this._bootObjects.push(bootObject);
                    
                } else {
                    console.log("No 'Create' function found on plugin '" + plugin + "'");
                }
            }
           
           
        }

        /**
        * Calls the boot functions on any objects that plugins used by the game instance have designated during creation. 
        * @method boot
        * @public
        */
        public boot() {
            console.log("boot pluginmanager");
            for (var i = 0; i < this._bootObjects.length; i++) {
                console.log("Booting plugin " + i);
                if ("boot" in this._bootObjects[i]) {
                    this._bootObjects[i].boot.call(this._bootObjects[i]);
                } else {
                    console.log("Warning! No boot function found on boot object");
                }
            }

        }

        public update() {
           
            for (var i = 0; i < this._bootObjects.length; i++) {
                if ("update" in this._bootObjects[i]) {
                    this._bootObjects[i].update.call(this._bootObjects[i]);
                }
            }

        }
        
    }
}