import * as express from 'express';

import {NotificationsSent} from '../controllers/notifications';
import {handlePullRequest} from '../controllers/webhook-events/pull-request';
import {handlePullRequestReview} from '../controllers/webhook-events/pull-request-review';
import {handleStatus} from '../controllers/webhook-events/status';
import {hooksModel} from '../models/hooksModel';

export interface WebHookHandleResponse {
  handled: boolean;
  notifications: NotificationsSent|null;
  message: string|null;
}

export function getRouter(): express.Router {
  const githubHookRouter = express.Router();
  githubHookRouter.post(
      '/', async (request: express.Request, response: express.Response) => {
        const eventName = request.headers['x-github-event'];
        if (!eventName) {
          response.status(400).send('No event type provided.');
          return;
        }

        if (eventName === 'ping') {
          // Ping event is sent by Github whenever a new webhook is setup
          response.send();
          return;
        }

        try {
          if (process.env.NODE_ENV === 'production') {
            const eventDelivery = request.headers['x-github-delivery'];
            if (!eventDelivery) {
              response.status(400).send('No event delivery provided.');
              return;
            }

            if (typeof eventDelivery !== 'string') {
              response.status(400).send('Event delivery was not a string.');
              return;
            }

            const loggedHook = await hooksModel.logHook(eventDelivery);
            if (!loggedHook) {
              response.status(202).send('Duplicate Event');
              return;
            }
          }

          let handled = null;
          // List of these events available here:
          // https://developer.github.com/webhooks/
          switch (eventName) {
            case 'status':
              handled = await handleStatus(request.body);
              break;
            case 'pull_request':
              handled = await handlePullRequest(request.body);
              break;
            case 'pull_request_review':
              handled = await handlePullRequestReview(request.body);
              break;
            default:
              console.warn(`Unsupported event type received: ${eventName}`);
              handled = false;
              break;
          }

          response.status(handled ? 200 : 202).json(handled);
        } catch (err) {
          console.error(err);
          response.status(500).send(err.message);
        }

        await hooksModel.cleanHooks();
      });
  return githubHookRouter;
}
