// Worker entry point. Only the default export lives here: the runtime treats
// any named export of the main module as an entrypoint.
import { handler } from './app';

export default handler;
