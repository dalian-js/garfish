import { SnapshotSandbox } from './sandbox';
import { interfaces } from '@garfish/core';

export interface SandboxConfig {
  open?: boolean;
  snapshot?: boolean;
  useStrict?: boolean;
  strictIsolation?: boolean;
}

declare module '@garfish/core' {
  export namespace interfaces {
    export interface Config {
      protectVariable?: PropertyKey[];
      insulationVariable?: PropertyKey[];
      sandbox?: SandboxConfig;
    }

    export interface App {
      snapshotSandbox?: SnapshotSandbox;
    }

    export interface Plugin {
      openBrowser?: boolean;
    }
  }
}

interface BrowserConfig {
  open?: boolean;
  protectVariable?: PropertyKey[];
}

export default function BrowserSnapshot(op?: BrowserConfig) {
  return function (Garfish: interfaces.Garfish): interfaces.Plugin {
    const config: BrowserConfig = op || { open: true };

    const options = {
      name: 'browser-snapshot',
      version: __VERSION__,
      openBrowser: false,
      bootstrap() {
        const sandboxConfig = Garfish?.options?.sandbox;
        if (sandboxConfig === false) config.open = false;
        if (sandboxConfig) {
          config.open = sandboxConfig?.open && sandboxConfig?.snapshot === true;
          config.protectVariable = Garfish?.options?.protectVariable || [];
        }
        options.openBrowser = config.open;
      },
      afterLoad(appInfo, appInstance) {
        if (!config.open) return;
        if (appInstance) {
          // existing
          if (appInstance.snapshotSandbox) return;
          const sandbox = new SnapshotSandbox(
            appInfo.name,
            config.protectVariable,
          );
          appInstance.snapshotSandbox = sandbox;
        }
      },
      beforeMount(appInfo, appInstance) {
        // existing
        if (!appInstance.snapshotSandbox) return;
        appInstance.snapshotSandbox.activate();
      },
      afterUnMount(appInfo, appInstance) {
        if (!appInstance.snapshotSandbox) return;
        appInstance.snapshotSandbox.deactivate();
      },
    };
    return options;
  };
}