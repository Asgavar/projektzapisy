import * as React from "react";

import { ErrorBox } from "./ErrorBox";

type Props = {};
type State = {
	error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
	public constructor(props: Props) {
		super(props);
		this.state = {
			error: null,
		};
	}

	public componentDidCatch(error: Error): void {
		this.setState({ error });
	}

	public render() {
		if (this.state.error) {
			return <ErrorBox
				errorTitle={<em>{this.state.error.toString()}</em>}
			/>;
		}
		return this.props.children;
	}
}