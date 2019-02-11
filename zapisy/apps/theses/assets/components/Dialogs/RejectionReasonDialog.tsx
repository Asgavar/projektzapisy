import * as React from "react";
import { confirmAlert } from "react-confirm-alert";
import styled from "styled-components";
import * as Mousetrap from "mousetrap";
import { ButtonsContainer, DialogContainer, SafeButton, DangerButton } from "./Base";
import { MIN_REJECTION_REASON_LENGTH, MAX_REJECTION_REASON_LENGTH } from "../../protocol_types";

export type RejectionDialogProps = {
	message: string;
	cancelText: string;
	acceptText: string;
	initialReason: string;
};

type RejectionDialogUIProps = RejectionDialogProps & {
	closeUI: () => void;
	resolve: (res: string) => void;
	reject: () => void;
};

const RejectionReasonField = styled.textarea`
	margin-top: 10px;
	margin-bottom: 3px;
	width: 100%;
	height: 100px;
	box-sizing: border-box;
`;

const HelpContainer = styled.div`
	width: 100%;
	font-size: 10.5px;
	display: flex;
	flex-direction: row;
	justify-content: space-between;
`;

const ExceededMessage = styled.span`
	color: red;
	font-weight: bold;
`;

type State = {
	currentReason: string;
};

class MessageDialogUI extends React.PureComponent<RejectionDialogUIProps, State> {
	private reasonFieldRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
	public constructor(props: RejectionDialogUIProps) {
		super(props);
		this.state = {
			currentReason: props.initialReason,
		};
	}

	public componentDidMount() {
		Mousetrap.bindGlobal("shift+enter", e => {
			this.onAccept();
			e.preventDefault();
		});
		Mousetrap.bindGlobal("esc", this.onCancel);
		const txtarea = this.reasonFieldRef.current;
		if (txtarea) {
			txtarea.focus();
		}
	}

	public componentWillUnmount() {
		Mousetrap.unbindGlobal(["enter", "esc"]);
	}

	private onAccept = () => {
		if (this.canAccept()) {
			this.props.closeUI();
			this.props.resolve(this.state.currentReason);
		}
	}
	private onCancel = () => {
		this.props.closeUI();
		this.props.reject();
	}

	private canAccept() {
		const len = this.state.currentReason.length;
		return len >= MIN_REJECTION_REASON_LENGTH && len <= MAX_REJECTION_REASON_LENGTH;
	}

	private onChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
		this.setState({ currentReason: ev.target.value });
	}

	public render() {
		const { props } = this;
		const canAccept = this.canAccept();
		const badLengthTooltip = (
			`Wymagane jest między ${MIN_REJECTION_REASON_LENGTH} a ${MAX_REJECTION_REASON_LENGTH } znaków`
		);
		return <DialogContainer>
			{props.message}
			<RejectionReasonField
				onChange={this.onChange}
				value={this.state.currentReason}
				maxLength={MAX_REJECTION_REASON_LENGTH}
				ref={this.reasonFieldRef}
			/>
			{this.renderHelp()}
			<ButtonsContainer>
				<SafeButton onClick={this.onCancel} text={props.cancelText} />
				<DangerButton
					onClick={this.onAccept}
					text={props.acceptText}
					enabled={canAccept}
					title={canAccept ? "" : badLengthTooltip}
				/>
			</ButtonsContainer>
		</DialogContainer>;
	}

	private renderCharCounts() {
		const reason = this.state.currentReason;
		if (reason.length < MIN_REJECTION_REASON_LENGTH) {
			const remaining = MIN_REJECTION_REASON_LENGTH - reason.length;
			return <span>Min. {MIN_REJECTION_REASON_LENGTH} znaków (jeszcze {remaining})</span>;
		}
		const remaining = MAX_REJECTION_REASON_LENGTH - reason.length;
		return <span>Maks. {MAX_REJECTION_REASON_LENGTH} znaków
			{remaining >= 0
			? <span> (pozostało {remaining})</span>
			: <ExceededMessage> (przekroczono o {-remaining})</ExceededMessage>}</span>;
	}

	private renderKeysHint() {
		return <span><pre>esc</pre> – anuluj, <pre>shift+enter</pre> – potwierdź</span>;
	}

	private renderHelp() {
		return <HelpContainer>
			{this.renderCharCounts()}
			{this.renderKeysHint()}
		</HelpContainer>;
	}
}

export function showRejectionReasonDialog(props: RejectionDialogProps): Promise<string> {
	return new Promise((resolve, reject) => {
		confirmAlert({
			title: "",
			message: "",
			customUI: ({ onClose }: any) => (
				<MessageDialogUI
					closeUI={onClose}
					resolve={resolve}
					reject={reject}
					{...props}
				/>
			)
		});
	});
}
