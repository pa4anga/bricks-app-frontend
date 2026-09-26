import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormRow, FormSection } from '@/components/form/FormSection';

describe('FormSection', () => {
  it('renders the title as a level-2 heading', () => {
    render(
      <FormSection title="Основни данни">
        <input aria-label="name" />
      </FormSection>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Основни данни' })).toBeInTheDocument();
  });

  it('renders its children', () => {
    render(
      <FormSection title="Данни" columns={2}>
        <input aria-label="first" />
        <input aria-label="second" />
      </FormSection>
    );

    expect(screen.getByLabelText('first')).toBeInTheDocument();
    expect(screen.getByLabelText('second')).toBeInTheDocument();
  });

  it('renders without a heading when no title is provided', () => {
    render(
      <FormSection>
        <input aria-label="field" />
      </FormSection>
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByLabelText('field')).toBeInTheDocument();
  });
});

describe('FormRow', () => {
  it('renders its children', () => {
    render(
      <FormRow>
        <input aria-label="wide" />
      </FormRow>
    );

    expect(screen.getByLabelText('wide')).toBeInTheDocument();
  });
});
