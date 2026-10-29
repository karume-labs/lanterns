import type { ControlScheme } from "../../app/settings-model";
import { useAppStore } from "../../app/store";
import { Slider, Toggle } from "../../components/ui/FormControls";
import { Panel } from "../../components/ui/Panel";

const SCHEMES: { id: ControlScheme; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "touch", label: "Touch" },
  { id: "kbm", label: "Keys" },
];

/** Every persisted setting; changes apply instantly with no save button. */
export const SettingsScreen = () => {
  const go = useAppStore((state) => state.go);
  const previousScreen = useAppStore((state) => state.previousScreen);
  const settings = useAppStore((state) => state.settings);
  const update = useAppStore((state) => state.updateSettings);
  const toast = useAppStore((state) => state.toast);

  const fullscreen = (): void => {
    void document.documentElement.requestFullscreen?.().catch(() => {
      toast("Fullscreen is not available here.");
    });
  };

  return (
    <div className="modal-dim screen-enter">
      <Panel className="settings-panel" onClose={() => go(previousScreen)}>
        <h2>Settings</h2>

        <h3>Controls</h3>
        <div className="segmented">
          {SCHEMES.map((scheme) => (
            <button
              aria-pressed={settings.scheme === scheme.id}
              className={settings.scheme === scheme.id ? "selected" : ""}
              key={scheme.id}
              onClick={() => update({ scheme: scheme.id })}
              type="button"
            >
              {scheme.label}
            </button>
          ))}
        </div>
        <Slider
          label={`Joystick size ${Math.round(settings.joystickSize * 100)}%`}
          onChange={(value) => update({ joystickSize: value })}
          value={settings.joystickSize}
        />
        <Slider
          label={`Joystick opacity ${Math.round(settings.joystickOpacity * 100)}%`}
          onChange={(value) => update({ joystickOpacity: value })}
          value={settings.joystickOpacity}
        />
        <Toggle
          checked={settings.leftHanded}
          label="Left-handed layout"
          onChange={(leftHanded) => update({ leftHanded })}
        />
        <Toggle
          checked={settings.aimAssist}
          label="Aim assist"
          onChange={(aimAssist) => update({ aimAssist })}
        />

        <h3>Sound</h3>
        <Toggle
          checked={settings.muted}
          label="Mute all"
          onChange={(muted) => update({ muted })}
        />
        <Slider
          label="Master"
          onChange={(master) =>
            update({ volumes: { ...settings.volumes, master } })
          }
          value={settings.volumes.master}
        />
        <Slider
          label="Music"
          onChange={(music) =>
            update({ volumes: { ...settings.volumes, music } })
          }
          value={settings.volumes.music}
        />
        <Slider
          label="SFX"
          onChange={(sfx) => update({ volumes: { ...settings.volumes, sfx } })}
          value={settings.volumes.sfx}
        />
        <Slider
          label="Ambience"
          onChange={(ambience) =>
            update({ volumes: { ...settings.volumes, ambience } })
          }
          value={settings.volumes.ambience}
        />

        <h3>Comfort</h3>
        <Toggle
          checked={settings.reduceMotion}
          label="Reduce motion"
          onChange={(reduceMotion) => update({ reduceMotion })}
        />
        <Toggle
          checked={settings.screenShake}
          label="Screen shake"
          onChange={(screenShake) => update({ screenShake })}
        />
        <Toggle
          checked={settings.damageNumbers}
          label="Damage numbers"
          onChange={(damageNumbers) => update({ damageNumbers })}
        />
        <Toggle
          checked={settings.colorblindSafe}
          label="Colorblind-safe colors"
          onChange={(colorblindSafe) => update({ colorblindSafe })}
        />

        <h3>Display</h3>
        <p className="setting-note">Language: English</p>
        <button className="secondary" onClick={fullscreen} type="button">
          Fullscreen
        </button>
        <button onClick={() => go(previousScreen)} type="button">
          Back
        </button>
      </Panel>
    </div>
  );
};
