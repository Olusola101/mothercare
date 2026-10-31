import { appConfig } from '../config/appConfig';

export function DisclaimerNote() {
  return (
    <p className="text-xs leading-relaxed text-ink-muted">
      {appConfig.appName} offers general information and tracking tools. It does not diagnose, treat or replace
      advice from a qualified healthcare professional, and dates and predictions are estimates, not certainties.
      In an emergency, contact your local emergency services.
    </p>
  );
}
