import * as models from "../models";
import { Assignment } from "./Assignment";
import { RootParentFinder } from "./RootParentFinder";

class UserSchedule {
  private timeLimit;
  private userId;
  private userSchedule = [];

  public constructor({ timeLimit, userId }) {
    this.timeLimit = timeLimit;
    this.userId = userId;
  }

  public asAnArrayOfAssignments() {
    return this.userSchedule;
  }

  public hasUserBeenAssignedToAnyWorkspaces() {
    return this.userSchedule.length > 0;
  }

  public assignWorkspace(workspaceId, startAtTimestamp) {
    const assignment = new Assignment({
      userId: this.userId,
      workspaceId,
      startAtTimestamp,
    });
    this.userSchedule.push(assignment);
  }

  public getMostRecentAssignment() {
    return this.userSchedule[this.userSchedule.length - 1];
  }

  public hasUserWorkedOnWorkspace(workspaceId) {
    for (const assignment of this.userSchedule) {
      if (assignment.getWorkspaceId() === workspaceId) {
        return true;
      }
    }

    return false;
  }

  public isUserCurrentlyWorkingOnWorkspace(workspaceId) {
    const lastWorkedOnAssignment = this.getMostRecentAssignment();
    const didUserLastWorkOnWorkspace = lastWorkedOnAssignment.getWorkspaceId() === workspaceId;

    if (!didUserLastWorkOnWorkspace) {
      return false;
    }

    const howLongAgoUserStartedWorkingOnIt = Date.now() - lastWorkedOnAssignment.getStartedAtTimestamp();
    const didUserStartWorkingOnItWithinTimeLimit = howLongAgoUserStartedWorkingOnIt < this.timeLimit;

    if (didUserStartWorkingOnItWithinTimeLimit) {
      return true;
    }

    return false;
  }
}

export { UserSchedule };
