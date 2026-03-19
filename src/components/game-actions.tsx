import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dumbbell, Hammer, Bed, Loader2 } from "lucide-react";
import useAppStore from "../zustand/store";

export function GameActions() {
  const player = useAppStore((state) => state.player);

  const executeTrain = () => console.log('execute train');
  const executeMine = () => console.log('execute mine');
  const executeRest = () => console.log('execute rest');

  const actions = [
    {
      icon: Dumbbell,
      label: "Train",
      description: "+10 EXP",
      onClick: executeTrain,
      color: "from-blue-500 to-blue-600",
      state: { isLoading: false, error: null, txStatus: null, txHash: null },
      canExecute: true,
    },
    {
      icon: Hammer,
      label: "Mine",
      description: "+5 Coins, -5 Health",
      onClick: executeMine,
      color: "from-yellow-500 to-yellow-600",
      state: { isLoading: false, error: null, txStatus: null, txHash: null },
      canExecute: true,
      disabledReason: undefined,
    },
    {
      icon: Bed,
      label: "Rest",
      description: "+20 Health",
      onClick: executeRest,
      color: "from-green-500 to-green-600",
      state: { isLoading: false, error: null, txStatus: null, txHash: null },
      canExecute: true,
      disabledReason: undefined,
    },
  ];

  return (
    <Card className="bg-white/5 backdrop-blur-xl border-white/10">
      <CardHeader>
        <CardTitle className="text-white text-xl font-bold">
          Game Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!player && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <div className="text-yellow-400 text-sm text-center">
              🎮 Connect wallet and create player to unlock actions
            </div>
          </div>
        )}

        {actions.map((action) => {
          const Icon = action.icon;
          const isLoading = action.state.isLoading;

          return (
            <div key={action.label} className="space-y-2">
              <Button
                onClick={action.onClick}
                disabled={!action.canExecute || isLoading}
                className={`w-full h-14 bg-gradient-to-r ${action.color} hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 mr-3" />
                )}
                <div className="flex flex-col items-start flex-1">
                  <span className="font-semibold">{action.label}</span>
                  <span className="text-xs opacity-80">
                    {action.description}
                  </span>
                </div>
                {action.disabledReason && (
                  <span className="text-xs opacity-60">
                    {action.disabledReason}
                  </span>
                )}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

