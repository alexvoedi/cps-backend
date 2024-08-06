import { Injectable, NotFoundException } from '@nestjs/common';
import { readFileSync } from 'fs';

const steps = [
  {
    id: 'sjgor894mg',
    title: 'Start',
    answer: 'knockers',
  },
  {
    id: 'egoorej',
    title: 'Step 1',
    answer: 'podog',
    previousStepId: 'sjgor894mg',
  },
  {
    id: 'gthrth',
    title: 'Step 2',
    answer: 'asdf',
    previousStepId: 'egoorej',
  },
];

@Injectable()
export class XService {
  getStepOrThrow(id: string) {
    const step = steps.find((step) => step.id === id);

    if (!step) {
      throw new NotFoundException('Step not found');
    }

    return step;
  }

  checkAnswer(id: string, answer: string) {
    const step = this.getStepOrThrow(id);

    if (step.answer !== answer) {
      throw new Error('Wrong answer');
    }

    const nextStep = steps.find((step) => step.previousStepId === id);

    return nextStep;
  }

  private loadFile(id: string): string {
    try {
      return readFileSync(`./data/x/${id}.md`, 'utf8');
    } catch {
      throw new Error('File not found');
    }
  }

  serializeStep(step: { id: string; title: string; previousStepId?: string }) {
    return {
      id: step.id,
      title: step.title,
      content: this.loadFile(step.id),
      progress: this.calculateProgress(step.id),
      previousStepId: step.previousStepId,
    };
  }

  private calculateProgress(id: string) {
    let completedSteps = 0;
    let currentStep = steps.find((step) => step.id === id);

    while (currentStep) {
      completedSteps++;
      currentStep = steps.find(
        (step) => step.id === currentStep.previousStepId,
      );
    }

    return completedSteps / steps.length;
  }
}
