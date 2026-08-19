import type React from "react";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
} from "react";
import type { LayoutStore } from "./store.ts";
import { deleteMedia, saveMedia } from "./media.ts";
import { countOverrides, isOverridden, resetField } from "./settings-utils.ts";
import {
  DIALOG_HEIGHT_LIMITS,
  DIALOG_WIDTH_LIMITS,
  MATERIAL_GRADES,
  MATERIAL_LIMITS,
  PAD_LIMITS,
  PAD_PRESETS,
  RADIUS_LIMITS,
  STATS_METRICS,
  materialGrade,
  type LayoutSettings,
  type MaterialSettings,
  type StatsMode,
} from "./types.ts";

export interface LayoutSettingsInjected {
  readonly store: LayoutStore;
}

const METRIC_LABELS: Readonly<Record<string, string>> = {
  turns: "轮次",
  steps: "步骤",
  llm: "模型耗时",
  tools: "工具耗时",
  ttft: "首 token",
  speed: "生成速度",
  cache: "缓存命中",
  tokens: "Token 用量",
};

/** The store flows through context so Field rows can offer single-field
    restore without prop drilling. */
const StoreContext = createContext<LayoutStore | null>(null);

export function LayoutSettingsSection({
  store,
}: LayoutSettingsInjected): React.ReactElement {
  const settings = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return <SettingsBody store={store} settings={settings} />;
}

/** macOS System Settings anatomy: a segmented tab control up top, then a
    column of section labels over quiet group boxes; every box is a stack of
    setting rows (label + description on the left rail, one control on the
    right, 1px hairline between rows). */
function SettingsBody({
  store,
  settings,
}: {
  store: LayoutStore;
  settings: LayoutSettings;
}): React.ReactElement {
  const [tab, setTab] = useState<TabId>("global");
  const overrides = countOverrides(settings);

  return (
    <section className="dsh-layout-settings">
      <StoreContext.Provider value={store}>
        {/* No panel-level heading: the workspace shell already renders
            this section's title + subtitle. The tabs row carries the
            dirty badge and reset so the functional bits survive. */}
        <div className="dsh-layout-toprow">
          <div
            className="dsh-layout-tabs"
            role="tablist"
            aria-label="布局设置分区"
          >
            {TABS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={tab === entry.id}
                onClick={() => setTab(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          {overrides > 0 && (
            <div className="dsh-layout-settings__actions">
              <span className="dsh-layout-dirty" title="与原生默认的差异项数">
                已修改 {overrides} 项
              </span>
              <button
                type="button"
                className="dsh-layout-settings__reset"
                onClick={() => store.reset()}
              >
                恢复默认
              </button>
            </div>
          )}
        </div>

        <div className="dsh-layout-settings__body">
          {tab === "global" && <GlobalPane store={store} settings={settings} />}
          {tab === "material" && (
            <MaterialPane store={store} settings={settings} />
          )}
          {tab === "conversation" && (
            <ConversationPane store={store} settings={settings} />
          )}
        </div>
      </StoreContext.Provider>
    </section>
  );
}

type TabId = "global" | "material" | "conversation";
const TABS: readonly { readonly id: TabId; readonly label: string }[] = [
  { id: "global", label: "全局" },
  { id: "material", label: "材质" },
  { id: "conversation", label: "对话" },
];

/** A section: a small tertiary label ("外观", "统计"…) over one group box of
    setting rows. */
function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="dsh-layout-settings__section">
      <h3 className="dsh-layout-settings__group">{label}</h3>
      <div className="dsh-layout-group">{children}</div>
    </section>
  );
}

/** One settings row: label + optional description on the left, the control
    on the right (vertically centered). `wide` rows let the control span the
    full width under the label — for segmented groups with many/long options,
    editors and card grids. `path` wires status ("differs from native") and
    single-field restore. */
function Field({
  label,
  description,
  path,
  wide = false,
  children,
}: {
  label: string;
  description?: string;
  path?: string;
  wide?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  const store = useContext(StoreContext);
  const overridden =
    path !== undefined &&
    store !== null &&
    isOverridden(store.getSnapshot(), path);
  return (
    <div className={wide ? "dsh-layout-row dsh-layout-row--wide" : "dsh-layout-row"}>
      <div className="dsh-layout-row__label">
        <div className="dsh-layout-row__title">
          <strong>{label}</strong>
          {overridden && (
            <>
              <span className="dsh-layout-field-status">已自定义</span>
              {store !== null && (
                <button
                  type="button"
                  className="dsh-layout-field-reset"
                  aria-label={`恢复${label}为原生`}
                  title="恢复原生"
                  onClick={() => resetField(store, path as string)}
                >
                  ↶
                </button>
              )}
            </>
          )}
        </div>
        {description !== undefined && (
          <span className="dsh-layout-row__desc">{description}</span>
        )}
      </div>
      <div className="dsh-layout-row__control">{children}</div>
    </div>
  );
}

/** A 36×20 capsule switch; the optional text beside it names the state
    ("原生" / "自定义"), the row label above carries the setting name. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}): React.ReactElement {
  return (
    <label className="dsh-layout-toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i aria-hidden="true" />
    </label>
  );
}

/** A 2px-track slider with a 12px accent knob; --dsh-layout-fill drives the
    filled run of the track (progress is native in Firefox). */
function Slider({
  name,
  min,
  max,
  step = 1,
  value,
  unit,
  onChange,
}: {
  name?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}): React.ReactElement {
  const fill = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <div className="dsh-layout-range">
      {name !== undefined && (
        <span className="dsh-layout-range__name">{name}</span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ "--dsh-layout-fill": `${fill}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <output>
        {value}
        {unit}
      </output>
    </div>
  );
}

function GlobalPane({
  store,
  settings,
}: {
  store: LayoutStore;
  settings: LayoutSettings;
}): React.ReactElement {
  const global = settings.global;
  const background = global.background;
  const setGlobal = (patch: Partial<LayoutSettings["global"]>): void =>
    store.update({ global: { ...global, ...patch } });
  const setBackground = (
    patch: Partial<LayoutSettings["global"]["background"]>,
  ): void => setGlobal({ background: { ...background, ...patch } });

  /** Local files become IndexedDB blobs; the setting keeps a small marker. */
  const pickLocalFile = async (
    file: File,
    slot: "imageUrl" | "videoUrl",
  ): Promise<void> => {
    try {
      const previous = background[slot];
      const marker = await saveMedia(file);
      setBackground({ [slot]: marker });
      if (previous !== marker) void deleteMedia(previous);
    } catch (error) {
      console.error("dsh-layout local media could not be stored:", error);
    }
  };
  return (
    <>
      <Group label="外观">
        <Field
          label="滚动条"
          path="global.scrollbar"
          description="作用于对话内容区与会话列表。"
        >
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={global.scrollbar === "native"}
              onClick={() => setGlobal({ scrollbar: "native" })}
            >
              显示（原生）
            </SegmentedButton>
            <SegmentedButton
              pressed={global.scrollbar === "hidden"}
              onClick={() => setGlobal({ scrollbar: "hidden" })}
            >
              隐藏
            </SegmentedButton>
          </div>
        </Field>
        <Field
          label="界面圆角"
          path="global.radius"
          description="按钮、气泡等控件同步应用；关闭时保持 DSH 原生圆角。"
        >
          <div className="dsh-layout-inline">
            <Toggle
              checked={global.radius !== null}
              onChange={(value) => setGlobal({ radius: value ? 8 : null })}
              label={global.radius === null ? "原生" : "自定义"}
            />
            {global.radius !== null && (
              <Slider
                min={RADIUS_LIMITS[0]}
                max={RADIUS_LIMITS[1]}
                value={global.radius}
                unit="px"
                onChange={(radius) => setGlobal({ radius })}
              />
            )}
          </div>
        </Field>
        <Field label="页面背景" path="global.background" wide>
          <div className="dsh-layout-segmented">
            {(["native", "color", "image", "video"] as const).map((mode) => (
              <SegmentedButton
                key={mode}
                pressed={background.mode === mode}
                onClick={() => setBackground({ mode })}
              >
                {mode === "native"
                  ? "原生"
                  : mode === "color"
                    ? "颜色"
                    : mode === "image"
                      ? "图片"
                      : "视频"}
              </SegmentedButton>
            ))}
          </div>
          {background.mode === "color" && (
            <div className="dsh-layout-colors">
              <input
                type="color"
                value={background.color}
                onChange={(event) => setBackground({ color: event.target.value })}
              />
            </div>
          )}
          {background.mode === "image" && (
            <>
              <input
                type="url"
                value={background.imageUrl}
                placeholder="图片地址 https://…"
                onChange={(event) =>
                  setBackground({ imageUrl: event.target.value })
                }
              />
              <FilePicker
                accept="image/*"
                label="选择本地图片…"
                onPick={(file) => void pickLocalFile(file, "imageUrl")}
              />
            </>
          )}
          {background.mode === "video" && (
            <>
              <input
                type="url"
                value={background.videoUrl}
                placeholder="视频地址 https://…"
                onChange={(event) =>
                  setBackground({ videoUrl: event.target.value })
                }
              />
              <FilePicker
                accept="video/*"
                label="选择本地视频…"
                onPick={(file) => void pickLocalFile(file, "videoUrl")}
              />
            </>
          )}
        </Field>
      </Group>

      <Group label="窗口与边距">
        <Field
          label="设置弹窗"
          path="global.dialog"
          wide
          description="自定义本设置窗口的宽高；关闭时使用 DSH 原生尺寸。"
        >
          <div className="dsh-layout-inline">
            <Toggle
              checked={
                global.dialog.width !== null || global.dialog.height !== null
              }
              onChange={(value) =>
                setGlobal({
                  dialog: value
                    ? {
                        width: global.dialog.width ?? 1000,
                        height: global.dialog.height ?? 880,
                      }
                    : { width: null, height: null },
                })
              }
              label={
                global.dialog.width === null && global.dialog.height === null
                  ? "原生"
                  : "自定义"
              }
            />
            {global.dialog.width !== null && (
              <Slider
                name="宽"
                min={DIALOG_WIDTH_LIMITS[0]}
                max={DIALOG_WIDTH_LIMITS[1]}
                step={20}
                value={global.dialog.width}
                unit="px"
                onChange={(width) =>
                  setGlobal({
                    dialog: { ...global.dialog, width },
                  })
                }
              />
            )}
            {global.dialog.height !== null && (
              <Slider
                name="高"
                min={DIALOG_HEIGHT_LIMITS[0]}
                max={DIALOG_HEIGHT_LIMITS[1]}
                step={20}
                value={global.dialog.height}
                unit="px"
                onChange={(height) =>
                  setGlobal({
                    dialog: { ...global.dialog, height },
                  })
                }
              />
            )}
          </div>
        </Field>
        <Field label="页面边距" path="global.padding" wide>
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={global.padding.mode === "auto"}
              onClick={() =>
                setGlobal({ padding: { ...global.padding, mode: "auto" } })
              }
            >
              自动
            </SegmentedButton>
            <SegmentedButton
              pressed={global.padding.mode === "custom"}
              onClick={() =>
                setGlobal({ padding: { ...global.padding, mode: "custom" } })
              }
            >
              自定义
            </SegmentedButton>
          </div>
          {global.padding.mode === "custom" &&
            (["desktop", "mobile"] as const).map((viewport) => (
              <div key={viewport} className="dsh-layout-pads">
                <p className="dsh-layout-pads__hint">
                  {viewport === "desktop" ? "桌面端 >767px" : "手机端 ≤767px"} ·
                  留空使用预设
                </p>
                {(
                  [
                    ["header", "头部"],
                    ["content", "内容区"],
                    ["composer", "输入区"],
                  ] as const
                ).map(([area, label]) => {
                  const preset = PAD_PRESETS[viewport][area];
                  const sides = global.padding[viewport][area];
                  const setSide = (side: "left" | "right", raw: string): void =>
                    setGlobal({
                      padding: {
                        ...global.padding,
                        [viewport]: {
                          ...global.padding[viewport],
                          [area]: {
                            ...sides,
                            [side]: raw === "" ? null : Number(raw),
                          },
                        },
                      },
                    });
                  return (
                    <div key={area} className="dsh-layout-pads__row">
                      <span>{label}</span>
                      <label>
                        左{" "}
                        <input
                          type="number"
                          min={PAD_LIMITS[0]}
                          max={PAD_LIMITS[1]}
                          placeholder={String(preset.left)}
                          value={sides.left ?? ""}
                          onChange={(event) =>
                            setSide("left", event.target.value)
                          }
                        />
                      </label>
                      <label>
                        右{" "}
                        <input
                          type="number"
                          min={PAD_LIMITS[0]}
                          max={PAD_LIMITS[1]}
                          placeholder={String(preset.right)}
                          value={sides.right ?? ""}
                          onChange={(event) =>
                            setSide("right", event.target.value)
                          }
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            ))}
        </Field>
      </Group>

      <Group label="窄屏（<768px）">
        <Field label="窄屏头部换行" path="global.narrow.headerWrap">
          <Toggle
            checked={global.narrow.headerWrap}
            onChange={(value) =>
              setGlobal({ narrow: { ...global.narrow, headerWrap: value } })
            }
            label={global.narrow.headerWrap ? "开启（防重叠）" : "关闭（原生）"}
          />
        </Field>
        <Field
          label="手机侧边栏"
          path="global.narrow.sidebar"
          description="全屏覆盖：内容区独占整屏，侧边栏收起为左缘把手，点开铺满全屏。悬浮：定宽悬浮抽屉盖在内容上方、不挤压内容列。原生：DSH 默认行为。桌面端在「宽屏」区块单独配置。"
        >
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={global.narrow.sidebar === "native"}
              onClick={() =>
                setGlobal({ narrow: { ...global.narrow, sidebar: "native" } })
              }
            >
              原生
            </SegmentedButton>
            <SegmentedButton
              pressed={global.narrow.sidebar === "fullscreen"}
              onClick={() =>
                setGlobal({
                  narrow: { ...global.narrow, sidebar: "fullscreen" },
                })
              }
            >
              全屏覆盖
            </SegmentedButton>
            <SegmentedButton
              pressed={global.narrow.sidebar === "float"}
              onClick={() =>
                setGlobal({ narrow: { ...global.narrow, sidebar: "float" } })
              }
            >
              悬浮
            </SegmentedButton>
          </div>
        </Field>
      </Group>

      <Group label="宽屏（≥768px）">
        <Field
          label="桌面侧边栏"
          path="global.wide.sidebar"
          description="悬浮：侧边栏变为定宽悬浮抽屉，内容列独占整行、不随侧边栏开合挤压，打开方式与窄屏一致（左缘把手或左滑，点遮罩、选中会话或 Esc 关闭）。原生：DSH 默认的内联侧边栏。"
        >
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={global.wide.sidebar === "native"}
              onClick={() =>
                setGlobal({ wide: { ...global.wide, sidebar: "native" } })
              }
            >
              原生
            </SegmentedButton>
            <SegmentedButton
              pressed={global.wide.sidebar === "float"}
              onClick={() =>
                setGlobal({ wide: { ...global.wide, sidebar: "float" } })
              }
            >
              悬浮
            </SegmentedButton>
          </div>
        </Field>
      </Group>
    </>
  );
}

function FilePicker({
  accept,
  label,
  onPick,
}: {
  accept: string;
  label: string;
  onPick: (file: File) => void;
}): React.ReactElement {
  return (
    <label>
      <input
        type="file"
        accept={accept}
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file !== undefined) onPick(file);
          event.target.value = "";
        }}
      />
      <span className="dsh-layout-file-button">{label}</span>
    </label>
  );
}

function MaterialPane({
  store,
  settings,
}: {
  store: LayoutStore;
  settings: LayoutSettings;
}): React.ReactElement {
  const material = settings.material;
  const setMaterial = (patch: Partial<MaterialSettings>): void =>
    store.update({ material: { ...material, ...patch } });
  const active = materialGrade(material);
  return (
    <Group label="材质">
      <Field
        label="磨砂材质"
        path="material.enabled"
        description="一张磨砂材质覆盖整个页面：侧边栏与内容区域共用同一层。"
      >
        <Toggle
          checked={material.enabled}
          onChange={(value) => setMaterial({ enabled: value })}
          label={material.enabled ? "开启" : "关闭（原生）"}
        />
      </Field>
      {material.enabled && (
        <>
          <Field
            label="材质档位"
            wide
            description="档位只是预设；拖动滑杆后即为自定义。"
          >
            <div className="dsh-layout-tiers">
              {MATERIAL_GRADES.map((grade) => (
                <button
                  key={grade.id}
                  type="button"
                  aria-pressed={active?.id === grade.id}
                  onClick={() => setMaterial({ ...grade.values })}
                >
                  <strong>{grade.name}</strong>
                  <span>{grade.hint}</span>
                </button>
              ))}
            </div>
          </Field>
          <Field label="不透明度" path="material.opacity">
            <Slider
              min={MATERIAL_LIMITS.opacity[0]}
              max={MATERIAL_LIMITS.opacity[1]}
              value={material.opacity}
              unit="%"
              onChange={(opacity) => setMaterial({ opacity })}
            />
          </Field>
          <Field label="模糊强度" path="material.blur">
            <Slider
              min={MATERIAL_LIMITS.blur[0]}
              max={MATERIAL_LIMITS.blur[1]}
              value={material.blur}
              unit="px"
              onChange={(blur) => setMaterial({ blur })}
            />
          </Field>
          <Field label="饱和度" path="material.saturation">
            <Slider
              min={MATERIAL_LIMITS.saturation[0]}
              max={MATERIAL_LIMITS.saturation[1]}
              value={material.saturation}
              unit="%"
              onChange={(saturation) => setMaterial({ saturation })}
            />
          </Field>
        </>
      )}
    </Group>
  );
}

function ConversationPane({
  store,
  settings,
}: {
  store: LayoutStore;
  settings: LayoutSettings;
}): React.ReactElement {
  const conversation = settings.conversation;
  const setConversation = (
    patch: Partial<LayoutSettings["conversation"]>,
  ): void => store.update({ conversation: { ...conversation, ...patch } });
  return (
    <>
      <Group label="排版">
        <Field
          label="阅读宽度"
          path="conversation.width"
          description="充满窗口是纯宽度变化：对话与输入框横向铺满，其余样式保持原生。"
        >
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={conversation.width === "native"}
              onClick={() => setConversation({ width: "native" })}
            >
              原生
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.width === "full"}
              onClick={() => setConversation({ width: "full" })}
            >
              充满窗口
            </SegmentedButton>
          </div>
        </Field>
        <Field label="输入框行数" path="conversation.inputRows" wide>
          <div className="dsh-layout-segmented dsh-layout-segmented--fill">
            <SegmentedButton
              pressed={conversation.inputRows === null}
              onClick={() => setConversation({ inputRows: null })}
            >
              原生
            </SegmentedButton>
            {[2, 3, 4, 5, 6].map((rows) => (
              <SegmentedButton
                key={rows}
                pressed={conversation.inputRows === rows}
                onClick={() => setConversation({ inputRows: rows })}
              >
                {rows} 行
              </SegmentedButton>
            ))}
          </div>
        </Field>
        <Field
          label="对话收笔"
          path="conversation.scrollEnd"
          wide
          description="收笔只调整滚动范围：对话记录止于输入区上方，输入框外观保持原生。"
        >
          <div className="dsh-layout-segmented dsh-layout-segmented--fill">
            <SegmentedButton
              pressed={conversation.scrollEnd === "native"}
              onClick={() => setConversation({ scrollEnd: "native" })}
            >
              全屏滚动（原生）
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.scrollEnd === "above"}
              onClick={() => setConversation({ scrollEnd: "above" })}
            >
              收笔（止于输入区上方）
            </SegmentedButton>
          </div>
        </Field>
      </Group>

      <Group label="气泡与轨迹页">
        <Field label="对话气泡" path="conversation.bubble" wide>
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={conversation.bubble === "native"}
              onClick={() => setConversation({ bubble: "native" })}
            >
              原生
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.bubble === "glass"}
              onClick={() => setConversation({ bubble: "glass" })}
            >
              磨砂
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.bubble === "solid"}
              onClick={() => setConversation({ bubble: "solid" })}
            >
              实色
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.bubble === "transparent"}
              onClick={() => setConversation({ bubble: "transparent" })}
            >
              无背景
            </SegmentedButton>
          </div>
        </Field>
        <Field label="轨迹页背景" path="conversation.trace.background">
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={conversation.trace.background === "native"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, background: "native" },
                })
              }
            >
              原生白
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.trace.background === "clear"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, background: "clear" },
                })
              }
            >
              透出材质
            </SegmentedButton>
          </div>
        </Field>
        <Field label="轨迹页宽度" path="conversation.trace.width">
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={conversation.trace.width === "full"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, width: "full" },
                })
              }
            >
              原生全宽
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.trace.width === "inset"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, width: "inset" },
                })
              }
            >
              对齐头部
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.trace.width === "message"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, width: "message" },
                })
              }
            >
              对齐阅读区
            </SegmentedButton>
          </div>
        </Field>
        <Field label="轨迹表留白" path="conversation.trace.tableTail">
          <div className="dsh-layout-segmented">
            <SegmentedButton
              pressed={conversation.trace.tableTail === "native"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, tableTail: "native" },
                })
              }
            >
              原生
            </SegmentedButton>
            <SegmentedButton
              pressed={conversation.trace.tableTail === "none"}
              onClick={() =>
                setConversation({
                  trace: { ...conversation.trace, tableTail: "none" },
                })
              }
            >
              移除
            </SegmentedButton>
          </div>
        </Field>
      </Group>

      <Group label="统计">
        <Field label="统计信息" path="conversation.stats" wide>
          <div className="dsh-layout-segmented">
            {(["native", "icon", "brief", "below"] as const).map(
              (mode: StatsMode) => (
                <SegmentedButton
                  key={mode}
                  pressed={conversation.stats === mode}
                  onClick={() => setConversation({ stats: mode })}
                >
                  {mode === "native"
                    ? "原生"
                    : mode === "icon"
                      ? "框内图标"
                      : mode === "brief"
                        ? "框内短信息"
                        : "框下方"}
                </SegmentedButton>
              ),
            )}
          </div>
          {conversation.stats !== "native" && (
            <div className="dsh-layout-chips">
              {STATS_METRICS.map((metric) => (
                <label key={metric}>
                  <input
                    type="checkbox"
                    checked={conversation.statsMetrics[metric]}
                    onChange={(event) =>
                      setConversation({
                        statsMetrics: {
                          ...conversation.statsMetrics,
                          [metric]: event.target.checked,
                        },
                      })
                    }
                  />
                  {METRIC_LABELS[metric]}
                </label>
              ))}
            </div>
          )}
        </Field>
      </Group>
    </>
  );
}

function SegmentedButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick}>
      {children}
    </button>
  );
}
