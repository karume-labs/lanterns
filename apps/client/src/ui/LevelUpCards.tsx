import type { UpgradeChoice } from "@lanterns/domain";

interface LevelUpCardsProps {
  choices: UpgradeChoice[];
  onPick: (upgradeId: string) => void;
}

export const LevelUpCards = ({ choices, onPick }: LevelUpCardsProps) => (
  <section className="levelup" aria-label="Team level up: choose one">
    <h3>Team level up - pick one</h3>
    <div className="cards">
      {choices.map((choice) => (
        <button key={choice.id} onClick={() => onPick(choice.id)} type="button">
          <b>{choice.label}</b>
          <small>{choice.detail}</small>
        </button>
      ))}
    </div>
  </section>
);
