"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTransition } from "react";
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps";
import { skipOnboarding } from "./actions";
import { Step1Profile } from "./step1-profile";
import { Step2Verticals } from "./step2-verticals";
import { Step3OperatingModel } from "./step3-operating-model";
import { Step4FirstAsset } from "./step4-first-asset";
import { Step5QuickAssessment } from "./step5-quick-assessment";

type CompletedData = {
  name: string;
  orgSize: string | null;
  primaryUseCase: string | null;
  clientVerticals: string[];
  operatingModel: string | null;
};

type StepDef = {
  id: number;
  title: string;
  description: string;
  estimatedMinutes: number;
  requiredFields: string[];
} | null;

type Props = {
  currentStep: number;
  completedData: CompletedData;
  stepDef: StepDef;
};

export function OnboardingWizardShell({
  currentStep: initialStep,
  completedData,
  stepDef: initialStepDef
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentStep = Math.min(Math.max(initialStep, 1), 5);
  const stepDef = initialStepDef ?? ONBOARDING_STEPS[currentStep - 1];
  const progressPct = (currentStep / 5) * 100;

  const handleSkip = () => {
    startTransition(() => {
      skipOnboarding();
    });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Let&apos;s assess your AI readiness
        </h1>
        <p className="mt-1 text-slate-600">
          We&apos;ll help you understand where you stand across governance, data, applications,
          platform, and supply chain — and what to do next.
        </p>
      </div>
      {/* Progress bar */}
      <div className="h-1 overflow-hidden rounded-full bg-slate-200">
        <div
          className="bg-navy-500 h-full rounded-full transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {ONBOARDING_STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s.id === currentStep
                  ? "bg-navy-600 text-white"
                  : s.id < currentStep
                    ? "bg-navy-100 text-navy-700"
                    : "bg-slate-200 text-slate-500"
              }`}
            >
              {s.id}
            </div>
          ))}
        </div>
        <Link
          href="/dashboard"
          onClick={(e) => {
            e.preventDefault();
            handleSkip();
          }}
          className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
        >
          I&apos;ll set this up later
        </Link>
      </div>

      {/* Step card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {stepDef && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">{stepDef.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{stepDef.description}</p>
          </div>
        )}

        {currentStep === 1 && (
          <Step1Profile
            completedData={completedData}
            onNext={() => startTransition(() => router.refresh())}
            isPending={isPending}
          />
        )}
        {currentStep === 2 && (
          <Step2Verticals
            completedData={completedData}
            onNext={() => startTransition(() => router.refresh())}
            isPending={isPending}
          />
        )}
        {currentStep === 3 && (
          <Step3OperatingModel
            completedData={completedData}
            onNext={() => startTransition(() => router.refresh())}
            isPending={isPending}
          />
        )}
        {currentStep === 4 && (
          <Step4FirstAsset
            onNext={() => startTransition(() => router.refresh())}
            isPending={isPending}
          />
        )}
        {currentStep === 5 && (
          <Step5QuickAssessment
            onComplete={() => startTransition(() => router.replace("/?welcome=1"))}
            isPending={isPending}
          />
        )}
      </div>
    </div>
  );
}
