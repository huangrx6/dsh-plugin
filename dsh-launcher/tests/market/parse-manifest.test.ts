/**
 * Tests for the launcher's manifest parser. The parser is the only
 * defense line against a hostile or malformed JSON manifest — the rest of
 * the marketplace trusts the parsed shape, so we test:
 *
 *   - the happy path (every field round-trips)
 *   - the field drops (missing optional fields do not appear in the record)
 *   - the field type guards (wrong types are skipped, not crashed)
 *   - the document-shape guards (root not an object, items not an array)
 */
import { describe, expect, it } from "vitest";
import { parseManifest } from "../../src/client/market/types.ts";

describe("parseManifest", () => {
  it("round-trips a fully populated manifest", () => {
    const input = {
      name: "DSH 内置",
      description: "官方默认清单",
      version: 1,
      items: [
        {
          id: "skill-write-doc",
          name: "Write Doc",
          description: "帮助用户写文档",
          tags: ["writing", "docs"],
          author: "huangrx6",
          version: "0.1.0",
          icon: "https://example.com/icon.png",
          kind: "skill",
          payload: {
            url: "https://github.com/user/skill",
            destination: "user-dsh",
          },
        },
      ],
    };
    const manifest = parseManifest(input);
    expect(manifest.name).toBe("DSH 内置");
    expect(manifest.description).toBe("官方默认清单");
    expect(manifest.version).toBe(1);
    expect(manifest.items).toHaveLength(1);
    const item = manifest.items[0];
    expect(item).toBeDefined();
    expect(item?.id).toBe("skill-write-doc");
    expect(item?.tags).toEqual(["writing", "docs"]);
    expect(item?.payload).toEqual({
      url: "https://github.com/user/skill",
      destination: "user-dsh",
    });
  });

  it("drops missing optional fields silently", () => {
    const input = {
      items: [
        { id: "mcp-foo", name: "Foo", description: "foo server", kind: "mcp" },
      ],
    };
    const manifest = parseManifest(input);
    const item = manifest.items[0];
    expect(item?.tags).toBeUndefined();
    expect(item?.author).toBeUndefined();
    expect(item?.version).toBeUndefined();
    expect(item?.icon).toBeUndefined();
    expect(item?.payload).toBeUndefined();
  });

  it("skips malformed items but keeps the rest", () => {
    const input = {
      items: [
        { id: "good", name: "Good", description: "ok", kind: "skill" },
        null,
        { id: "", name: "x", description: "x" }, // missing id
        { id: "no-name", name: "", description: "x" }, // missing name
        { id: "no-desc", name: "x", description: 42 }, // wrong type
        { id: "second-good", name: "Second", description: "ok", kind: "mcp" },
      ],
    };
    const manifest = parseManifest(input);
    expect(manifest.items).toHaveLength(2);
    expect(manifest.items[0]?.id).toBe("good");
    expect(manifest.items[1]?.id).toBe("second-good");
  });

  it("refuses non-object roots", () => {
    expect(() => parseManifest(null)).toThrow();
    expect(() => parseManifest([])).toThrow();
    expect(() => parseManifest("manifest")).toThrow();
  });

  it("refuses an items field that is not an array", () => {
    expect(() => parseManifest({ items: "oops" })).toThrow();
    expect(() => parseManifest({ items: { id: "foo" } })).toThrow();
  });

  it('coerces unknown kind values to a safe "general" sentinel', () => {
    const input = {
      items: [{ id: "foo", name: "Foo", description: "x", kind: "rainbows" }],
    };
    const manifest = parseManifest(input);
    expect(manifest.items[0]?.kind).toBe("general");
  });

  it("filters tag entries that are not strings", () => {
    const input = {
      items: [
        {
          id: "foo",
          name: "Foo",
          description: "x",
          kind: "skill",
          tags: ["ok", 42, null, "fine", { not: "a string" }],
        },
      ],
    };
    const manifest = parseManifest(input);
    expect(manifest.items[0]?.tags).toEqual(["ok", "fine"]);
  });
});
