import { useEffect, useState } from "react";
import { type ScreenName, useAppStore } from "../../app/store";
import { Panel } from "../../components/ui/Panel";

const SCREENS: ScreenName[] = [
  "splash",
  "menu",
  "create",
  "join",
  "hub",
  "match",
  "pause",
  "leaderboard",
  "howto",
  "settings",
  "credits",
];

interface AtlasManifest {
  frames: Record<string, unknown>;
}
interface AudioManifest {
  sounds: { id: string; file: string; bus: string }[];
}

/**
 * /dev gallery: every screen state, every sprite frame name, and a button
 * per sound. Manifests are optional - sections appear when assets exist.
 */
export const DevGallery = () => {
  const go = useAppStore((state) => state.go);
  const [atlas, setAtlas] = useState<AtlasManifest | null>(null);
  const [audio, setAudio] = useState<AudioManifest | null>(null);

  useEffect(() => {
    void fetch("/sprites/atlas.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: AtlasManifest | null) => setAtlas(json))
      .catch(() => setAtlas(null));
    void fetch("/audio/manifest.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((json: AudioManifest | null) => setAudio(json))
      .catch(() => setAudio(null));
  }, []);

  return (
    <main className="dev-gallery screen-enter">
      <h1>Dev gallery</h1>
      <Panel>
        <h2>Screens</h2>
        <div className="dev-grid">
          {SCREENS.map((screen) => (
            <button key={screen} onClick={() => go(screen)} type="button">
              {screen}
            </button>
          ))}
        </div>
        <h2>Sprites</h2>
        {atlas ? (
          <ul className="dev-list">
            {Object.keys(atlas.frames).map((frame) => (
              <li key={frame}>{frame}</li>
            ))}
          </ul>
        ) : (
          <p className="empty">Atlas not built yet - run the sprite tool.</p>
        )}
        <h2>Sounds</h2>
        {audio ? (
          <div className="dev-grid">
            {audio.sounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent("lanterns:play-sound", {
                      detail: sound.id,
                    }),
                  )
                }
                type="button"
              >
                {sound.id}
              </button>
            ))}
          </div>
        ) : (
          <p className="empty">No audio manifest yet - run the audio tool.</p>
        )}
        <button onClick={() => window.location.assign("/")} type="button">
          Back to the game
        </button>
      </Panel>
    </main>
  );
};
