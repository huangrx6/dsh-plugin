/**
 * MCP marketplace entry. The launcher workspace imports the
 * `McpMarketSection` component from this module so a launcher install
 * without dsh-mcp-manager falls back to the launcher's placeholder; here
 * we re-export the component.
 */
export { McpMarketSection } from "./McpMarketSection.tsx";
export type { McpMarketSectionProps } from "./McpMarketSection.tsx";
export { WORKSPACE_SECTION_SLOT } from "dsh-launcher/client/workspace";
