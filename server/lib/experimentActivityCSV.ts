import { print } from "graphql";
import gql from "graphql-tag";
import { Parser } from "json2csv";

export async function experimentActivityCSV(server, res) {
  const jsonResponse = await server.executeOperation({
    query: print(gql`
      query assignments {
        assignments {
          id
          createdAt
          startAtTimestamp
          endAtTimestamp
          user {
            id
            email
          }
          workspace {
            id
            serialId
            rootWorkspace {
              id
              serialId
            }
            isEligibleForHonestOracle
            isEligibleForMaliciousOracle
          }
          experiment {
            id
            name
          }
        }
      }
    `),
  });

  const data =
    jsonResponse && jsonResponse.data && jsonResponse.data.assignments;

  data &&
    data.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const processedData =
    data &&
    data.map(assignment => ({
      "User Email": assignment.user.email,
      Experiment: assignment.experiment.name,
      Duration:
        Math.round(
          ((assignment.endAtTimestamp - assignment.startAtTimestamp) /
            1000 /
            60) *
            100,
        ) / 100, // minutes w/ 2 decimal places
      "Workspace Type": assignment.workspace.isEligibleForHonestOracle
        ? "HONEST"
        : assignment.workspace.isEligibleForMaliciousOracle
        ? "MALICIOUS"
        : "JUDGE",
      "Link To History": `https://mosaic.ought.org/snapshots/${
        assignment.workspace.serialId
      }`,
      "Link to Tree": `https://mosaic.ought.org/compactTree/${
        assignment.workspace.rootWorkspace.serialId
      }/expanded=true&activeWorkspace=${assignment.workspace.id}`,
    }));

  const parser = new Parser();

  const csv = parser.parse(processedData);

  res.setHeader("Content-Type", "text/csv");
  res.end(csv);
}
