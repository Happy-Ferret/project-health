import anyTest, {TestInterface} from 'ava';

import {startTestReplayServer} from '../../../replay-server';
import {fetchIncomingData} from '../../../server/apis/dash-data';
import {IncomingDashResponse, PullRequest} from '../../../types/api';
import {PullRequestReviewState} from '../../../types/gql-types';
import {initGithub} from '../../../utils/github';
import {getTestTokens} from '../../get-test-tokens';

type TestContext = {
  data: IncomingDashResponse,
  prsById: Map<string, PullRequest>,
};
const test = anyTest as TestInterface<TestContext>;

test.before(
    () => {
        // TODO Start server
    })

/**
 * Generates the test context object before each test.
 */
test.beforeEach(async (t) => {
  const {server, url} =
      await startTestReplayServer(t, 'project-health1-dashboard incoming');
  initGithub(url, url);

  server.close();
});

test.after(
    () => {
        // TODO Close server
    })

test('[issues]: should retrieve issues for a user', (t) => {
  t.deepEqual(t.context.prsById.get('14'), {
    id: 'MDExOlB1bGxSZXF1ZXN0MTc0NDY2NTk5',
    author: 'project-health2',
    avatarUrl: 'https://avatars3.githubusercontent.com/u/34584974?v=4',
    createdAt: 1520881768000,
    events: [
      {
        review: {
          author: 'project-health1',
          createdAt: 1520881784000,
          reviewState: PullRequestReviewState.CHANGES_REQUESTED,
        },
        type: 'MyReviewEvent',
      },
    ],
    number: 14,
    owner: 'project-health1',
    repo: 'repo',
    status: {
      type: 'ChangesRequested',
    },
    title: 'Modify readme description',
    url: 'https://github.com/project-health1/repo/pull/14',
  });
});
