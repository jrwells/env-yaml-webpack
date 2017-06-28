import { parse } from 'env-yaml';
import fs from 'fs';
import { DefinePlugin } from 'webpack';

class EnvYaml {
  /**
   * The env-yaml-webpack plugin.
   * @param { object } options - The parameters.
   * @param { String } [options.path=./.env.yml] - The location of the environment variable.
   * @param { Bool|String } [options.safe=false] - If false ignore safe-mode, if true load `'./.env.example.yml'`, if a string load that file as the sample.
   * @param { Bool } [options.systemvars=false] - If true, load system environment variables.
   * @param { Bool } [options.silent=false] - If true, suppress warnings, if false, display warnings
   * @returns { webpack.DefinePlugin }
   */
  constructor (options) {
    options = Object.assign({
      path: './.env.yml',
      safe: false,
      systemvars: false,
      silent: false
    }, options);

    let vars = { };
    if (options.systemvars) {
      Object.keys(process.env).map(key => {
        vars[key] = process.env[key];
      });
    }

    const env = this.loadFile(options.path, options.silent);

    let blueprint = env;
    if (options.safe) {
      let file = './.env.example.yml';
      if (options.safe !== true) {
        file = options.safe;
      }
      blueprint = this.loadFile(file, options.silent);
    }

    Object.keys(blueprint).map(key => {
      const value = env[key];
      if (!value && options.safe) {
        throw new Error(`Missing environment variable: ${key}`);
      } else {
        vars[key] = value;
      }
    });

    const formatData = Object.keys(vars).reduce((obj, key) => {
      obj[`process.env.${key}`] = JSON.stringify(vars[key]);
      return obj;
    }, { });

    return new DefinePlugin(formatData);
  }

  /**
   * Load and parses a file
   * @param { String } file - The file to load.
   * @param { Bool } silent - If true, suppress warnings, if false, display warnings.
   * @returns { Object }
   */
  loadFile (file, silent) {
    try {
      return parse(fs.readFileSync(file));
    } catch (err) {
      this.warn(`Failed to load ${file}.`, silent);
      return { };
    }
  }

  /**
   * @param { String } msg - The message.
   * @param { Bool } silent - If true, display the message, if false, suppress the message.
   */
  warn (msg, silent) {
    !silent && console.warn(msg);
  }
}

export default EnvYaml;