import { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type Props = PropsWithChildren<{
  direction?: "column" | "row";
  gapX?: "sm" | "md" | "lg";
  gapY?: "sm" | "md" | "lg";
  hasPadding?: boolean;
  grow?: boolean;
  itemsCenter?: boolean;
  justifyCenter?: boolean;
  className?: string;
}>;

const Flex = (props: Props) => {
  const {
    children,
    direction = "column",
    hasPadding,
    itemsCenter,
    justifyCenter,
    grow,
    gapX,
    gapY,
    className,
  } = props;

  return (
    <div
      className={cn(
        "flex w-full",
        { "flex-col": direction === "column" },
        { "flex-row": direction === "row" },
        { "p-4": hasPadding },
        { grow: grow },
        { "items-center": itemsCenter },
        { "justify-center": justifyCenter },
        { "gap-x-2": gapX === "sm" },
        { "gap-x-4": gapX === "md" },
        { "gap-x-6": gapX === "lg" },
        { "gap-y-2": gapY === "sm" },
        { "gap-y-4": gapY === "md" },
        { "gap-y-6": gapY === "lg" },
        className,
      )}
    >
      {children}
    </div>
  );
};

export default Flex;
