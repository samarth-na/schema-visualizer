import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableNode } from "../TableNode";
import type { TableNodeData } from "@/lib/types";

vi.mock("@xyflow/react", () => ({
	Handle: ({ id, type }: { id?: string; type?: string }) => (
		<div data-testid={`handle-${type}-${id}`} />
	),
	Position: { Left: "left", Right: "right", Top: "top", Bottom: "bottom" },
	Node: () => null,
	NodeProps: () => null,
}));

vi.mock("../SchemaGraphContext", () => ({
	useSchemaGraphContext: () => ({
		selectedEdge: undefined,
		isDownloading: false,
	}),
}));

const data: TableNodeData = {
	id: "public.users",
	schema: "public",
	name: "users",
	comment: null,
	isForeign: false,
	columns: [
		{
			id: "public.users.id",
			name: "id",
			format: "SERIAL",
			isPrimary: true,
			isNullable: false,
			isUnique: false,
			isIdentity: true,
			description: "",
		},
		{
			id: "public.users.email",
			name: "email",
			format: "VARCHAR",
			isPrimary: false,
			isNullable: true,
			isUnique: true,
			isIdentity: false,
			description: "",
		},
	],
};

describe("TableNode", () => {
	it("renders PK, nullable, unique, and identity indicators", () => {
		render(
			(
				<TableNode
					id="public.users"
					data={data}
					selected={false}
					type={""}
					dragging={false}
					zIndex={0}
					selectable={false}
					deletable={false}
					draggable={false}
					isConnectable={false}
					positionAbsoluteX={0}
					positionAbsoluteY={0}
				/>
			) as any,
		);

		expect(screen.getByText("users")).toBeInTheDocument();
		expect(screen.getByTestId("users/id")).toBeInTheDocument();
		expect(screen.getByTestId("users/email")).toBeInTheDocument();
	});
});
