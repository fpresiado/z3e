import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import axios from "axios";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface Tutorial {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialOverlayProps {
  tutorialId: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function TutorialOverlay({ tutorialId, onComplete, onSkip }: TutorialOverlayProps) {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const loadTutorial = async () => {
      try {
        const response = await axios.get(`/api/tutorials/${tutorialId}`);
        setTutorial(response.data);
      } catch (error) {
        console.error("Failed to load tutorial:", error);
      } finally {
        setLoading(false);
      }
    };
    loadTutorial();
  }, [tutorialId]);

  useEffect(() => {
    if (!tutorial) return;

    const step = tutorial.steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        setTargetRect(null);
      }
    } else {
      setTargetRect(null);
    }
  }, [tutorial, currentStep]);

  const handleNext = async () => {
    if (!tutorial || !userId) return;

    const step = tutorial.steps[currentStep];
    await axios.post("/api/tutorials/complete-step", {
      userId,
      tutorialId,
      stepId: step.id,
    });

    if (currentStep < tutorial.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    if (!tutorial || !userId) return;

    const step = tutorial.steps[currentStep];
    await axios.post("/api/tutorials/skip-step", {
      userId,
      tutorialId,
      stepId: step.id,
    });

    onSkip();
  };

  if (loading || !tutorial) {
    return null;
  }

  const step = tutorial.steps[currentStep];
  const isCenter = !step.target || step.position === "center";
  const isLastStep = currentStep === tutorial.steps.length - 1;

  const getTooltipPosition = () => {
    if (isCenter || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const padding = 16;
    const tooltipWidth = 400;
    const tooltipHeight = 200;

    switch (step.position) {
      case "top":
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      case "bottom":
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2 - tooltipWidth / 2}px`,
        };
      case "left":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
        };
      case "right":
        return {
          top: `${targetRect.top + targetRect.height / 2 - tooltipHeight / 2}px`,
          left: `${targetRect.right + padding}px`,
        };
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left}px`,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

      {targetRect && !isCenter && (
        <div
          className="absolute border-2 border-primary rounded-lg shadow-lg ring-4 ring-primary/30"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            pointerEvents: "none",
          }}
        />
      )}

      <Card
        className="absolute w-[400px] p-6 shadow-xl z-50"
        style={getTooltipPosition()}
        data-testid="tutorial-tooltip"
      >
        <button
          onClick={handleSkip}
          className="absolute top-3 right-3 p-1 hover:bg-muted rounded"
          data-testid="button-close-tutorial"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">
              Step {currentStep + 1} of {tutorial.steps.length}
            </span>
            <div className="flex-1 flex gap-1">
              {tutorial.steps.map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 h-1 rounded-full ${
                    i <= currentStep ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <h3 className="text-lg font-semibold">{step.title}</h3>
        </div>

        <p className="text-muted-foreground mb-6">{step.description}</p>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            data-testid="button-skip-tutorial"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrev} data-testid="button-prev-step">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} data-testid="button-next-step">
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
