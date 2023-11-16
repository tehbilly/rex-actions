import { error, setFailed } from "@actions/core";
import { which } from '@actions/io';

export async function pre(): Promise<void> {
  try {
    await which('dotnet', true);
  } catch (e) {
    // Fail the workflow run if unable to find dotnet
    if (e instanceof Error) {
      error(e);
      setFailed(e.message);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
pre();
