import { type User } from "@supabase/supabase-js";
import { type UUID } from "crypto";
import dotenv from "dotenv";
import { createRuntime } from "../../../test/createRuntime";
import { GetTellMeAboutYourselfConversation1 } from "../../../test/data";
import { populateMemories } from "../../../test/populateMemories";
import { getRelationship } from "../../relationships";
import { type BgentRuntime } from "../../runtime";
import { type Message } from "../../types";
import action from "../wait"; // Import the wait action
import { zeroUuid } from "../../constants";
import { runAiTest } from "../../../test/runAiTest";

dotenv.config({ path: ".dev.vars" });

describe("Wait Action Behavior", () => {
  let user: User;
  let runtime: BgentRuntime;
  let room_id: UUID;

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(async () => {
    await cleanup();
  });

  beforeAll(async () => {
    const setup = await createRuntime({
      env: process.env as Record<string, string>,
      actions: [action],
    });
    user = setup.session.user;
    runtime = setup.runtime;

    const data = await getRelationship({
      runtime,
      userA: user?.id as UUID,
      userB: zeroUuid,
    });

    room_id = data?.room_id;

    await cleanup();
  });

  async function cleanup() {
    await runtime.factManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
    await runtime.messageManager.removeAllMemoriesByUserIds([
      user?.id as UUID,
      zeroUuid,
    ]);
  }

  test("Test wait action behavior", async () => {
    await runAiTest("Test wait action behavior", async () => {
      const message: Message = {
        senderId: zeroUuid as UUID,
        agentId: zeroUuid,
        userIds: [user?.id as UUID, zeroUuid],
        content: {
          content: "Please wait a moment, I need to think about this...",
          action: "WAIT",
        },
        room_id: room_id as UUID,
      };

      const handler = action.handler!;

      await populateMemories(runtime, user, room_id, [
        GetTellMeAboutYourselfConversation1,
      ]);

      const result = (await handler(runtime, message)) as boolean;
      // Expectation depends on the implementation of the wait action.
      // For instance, it might be that there's no immediate output,
      // or the output indicates waiting, so adjust the expectation accordingly.
      return result === true;
    });
  }, 60000);
});
