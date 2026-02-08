import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
    as?: 'p' | 'span'
    size?: 'sm' | 'md' | 'lg'
	bold?: boolean;
    center?: boolean;
    muted?:boolean
    className?: string
}>;

const Text = (props: Props) => {
	const { children, bold, center, as = "span", muted, size = 'md', className } = props;

    const As = as

	return (
		<As className={cn(
            "leading-5", 
            { "font-bold": bold }, 
            { "text-center": center }, 
            { "text-muted-foreground": muted }, 
            { "text-sm": size === "sm" }, 
            { "text-base": size === "md" }, 
            { "text-lg": size === "lg" }, 
            className
        )}>
			{children}
		</As>
	);
};

export default Text;
