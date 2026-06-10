import { getScoreColor, getScoreDescriptor } from "../scoreEngine";

describe("scoreEngine", () => {
  it('passing 4.7 or 4.6 successfully drops back to the "Very Good" descriptor', () => {
    expect(getScoreDescriptor(4.6)).toBe("Very Good");
    expect(getScoreDescriptor(4.7)).toBe("Very Good");
  });

  it("calculates distinct hex colors for 0.1 step increments", () => {
    const color45 = getScoreColor(4.5);
    const color46 = getScoreColor(4.6);
    expect(color45).not.toBe(color46);
    expect(color45.startsWith("#")).toBe(true);
  });

  it("caps scores to strict typing limits (1.0 <= score <= 5.0)", () => {
    expect(getScoreDescriptor(0)).toBe("Horrendous");
    expect(getScoreDescriptor(6)).toBe("Perfect");
    expect(getScoreColor(0)).toBe(getScoreColor(1.0));
    expect(getScoreColor(6)).toBe(getScoreColor(5.0));
  });
});
