import * as React from "react";

import { ThesisVote } from "../../../protocol_types";
import styled from "styled-components";
import { canCastVoteAsUser, canChangeThesisVote } from "../../../permissions";
import { VoteIndicator } from "./VoteIndicator";
import { Employee, AppUser } from "../../../users";
import { Thesis } from "../../../thesis";
import { SingleVote } from "../../../votes";

type Props = {
	user: AppUser;
	vote: SingleVote;
	voter: Employee;
	thesis: Thesis;
	onChange: (voter: Employee, v: ThesisVote) => void;
};

const voteCycle = [ThesisVote.None, ThesisVote.Accepted, ThesisVote.Rejected];

export class SingleVoteView extends React.PureComponent<Props> {
	public render() {
		const { user, voter, thesis, vote } = this.props;
		const allowAction = canCastVoteAsUser(voter) && canChangeThesisVote(thesis);
		const sameUser = user.person.isEqual(voter);
		const tooltip = vote.value === ThesisVote.Rejected ? vote.reason : "";
		const content = <>
			<VoteIndicator active={allowAction} value={vote.value} />
			<VoteLabel
				style={sameUser ? { fontWeight: "bold" } : {}}
			>{voter.username}</VoteLabel>
		</>;
		return allowAction
			? <VoteContainerActive title={tooltip} onClick={this.onClick}>{content}</VoteContainerActive>
			: <VoteContainerInactive title={tooltip}>{content}</VoteContainerInactive>;
	}

	private onClick = () => {
		this.props.onChange(this.props.voter, nextValue(this.props.vote.value));
	}
}

function nextValue(value: ThesisVote) {
	const valIdx = voteCycle.indexOf(value);
	return voteCycle[(valIdx + 1) % voteCycle.length];
}

const VoteContainerBase = styled.div`
	margin-bottom: 5px;
	user-select: none;
	display: flex;
	align-items: center;
    justify-content: center;
`;

const VoteContainerActive = styled(VoteContainerBase)`
	cursor: pointer;
`;

const VoteContainerInactive = styled(VoteContainerBase)`
	cursor: default;
`;

const VoteLabel = styled.span`
	margin-left: 5px;
	width: 60px;
	display: inline-block;
	text-align: left;
`;
