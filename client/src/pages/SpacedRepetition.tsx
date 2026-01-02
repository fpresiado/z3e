import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw, TrendingUp } from "lucide-react";

export default function SpacedRepetition() {
  const { data: dueItems = [], isLoading } = useQuery({
    queryKey: ["/api/spaced-rep/due"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/spaced-rep/stats"],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Spaced Repetition Review</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Smart review scheduling using the SM-2 algorithm
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Reviews</p>
            <p className="text-2xl font-bold">{(stats as any).totalReviews}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Items Scheduled</p>
            <p className="text-2xl font-bold">{(stats as any).itemsScheduled}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Due for Review</p>
            <p className="text-2xl font-bold">{(stats as any).dueForReview}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Ease Factor</p>
            <p className="text-2xl font-bold">{(stats as any).avgEaseFactor}</p>
          </Card>
        </div>
      )}

      {isLoading ? (
        <p>Loading review items...</p>
      ) : (dueItems as any[]).length > 0 ? (
        <div className="space-y-3">
          {(dueItems as any[]).map((item: any) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{item.question?.prompt}</p>
                  <div className="flex gap-2 mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span>
                      <RotateCcw className="w-3 h-3 inline mr-1" />
                      {item.repetitions} reviews
                    </span>
                    <span>
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      Ease: {item.easeFactor.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    Hard
                  </Button>
                  <Button size="sm" variant="outline">
                    Good
                  </Button>
                  <Button size="sm" variant="default">
                    Easy
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No items due for review. Great job!</p>
        </Card>
      )}
    </div>
  );
}
