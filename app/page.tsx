import { GameProvider } from "@/components/game/game-provider";
import { GameShell } from "@/components/game/game-shell";

export default function Page() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
