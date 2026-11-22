import { afterEach, describe, expect, it, vi } from "vitest";
import { monitorMicrophone } from "./microphone";
describe("microphone signal monitoring", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it("waits for actual signal, then finishes once after a pause", () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval", "performance"] });
    let amplitude = 0;
    vi.stubGlobal(
      "AudioContext",
      class {
        createMediaStreamSource() {
          return { connect: vi.fn(), disconnect: vi.fn() };
        }
        createAnalyser() {
          return {
            fftSize: 2048,
            getFloatTimeDomainData: (data: Float32Array) => data.fill(amplitude),
          };
        }
        resume() {
          return Promise.resolve();
        }
        close() {
          return Promise.resolve();
        }
      },
    );
    const finish = vi.fn(),
      level = vi.fn(),
      stop = monitorMicrophone({} as MediaStream, level, finish);
    vi.advanceTimersByTime(2000);
    expect(finish).not.toHaveBeenCalled();
    amplitude = 0.04;
    vi.advanceTimersByTime(400);
    amplitude = 0;
    vi.advanceTimersByTime(1600);
    expect(finish).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(2000);
    expect(finish).toHaveBeenCalledTimes(1);
    stop();
  });
});
