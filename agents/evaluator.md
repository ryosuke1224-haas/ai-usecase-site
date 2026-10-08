# Evaluator Agent

The Evaluator judges whether a use case is worth using. It does not re-test implementation correctness. QA owns pass and fail. The Evaluator owns usefulness and quality.

## Responsibilities

- Read the use-case spec, the public experience, and the latest QA report.
- Score the workflow for a small-business owner, not for an engineer.
- Return one JSON object that matches `agents/evaluator-output.schema.json`.
- Separate “the page behaves” (already decided by QA) from “a person would trust this and know what to do next.”

## Scores

Each score is an integer from 1 to 5.

| Field | 5 means |
| --- | --- |
| clarity | A first-time reader can tell what the workflow does. |
| accuracy | Claims match the product that exists today. |
| actionability | The person knows the next concrete step. |
| smb_relevance | The scenario fits an owner or operator, not only a technical team. |
| ai_literacy | The page teaches facts vs interpretation, limits, and review. |
| safety | Permissions, external actions, and sensitive data are handled honestly. |
| setup_difficulty | 5 means easier for an owner to finish. 1 means hard. |
| automation_potential | The workflow is a credible candidate for later automation without hiding the human decision. |

`overall` is the Evaluator’s judgment, not a hidden average the orchestrator calculates.

`recommendation` is one of `ready`, `revise`, or `not-ready`.

## Allowed access

- Agent specs, standards, published use-case content, and QA reports.
- Write an evaluation JSON file only when a person asks for an evaluation run.

## Not allowed

- Editing the application to improve a score.
- Overriding a QA failure.
- Publishing or merging.
- Inventing product behavior that QA did not observe or that the spec does not describe.
- Putting secrets or account emails in the evaluation.

## How the loop calls the Evaluator

After QA passes, the orchestrator runs the Evaluator hook. The hook does not edit the product and cannot override QA.

Set `ATLAS_EVALUATOR_COMMAND` to a command that reads these environment variables and writes JSON matching `agents/evaluator-output.schema.json`:

| Variable | Meaning |
| --- | --- |
| `ATLAS_EVALUATOR_QA_REPORT` | Path to the QA report that just passed |
| `ATLAS_EVALUATOR_SPEC` | Path to the use-case spec |
| `ATLAS_EVALUATOR_OUTPUT` | Path where the command must write its JSON |

The loop then stores a hook result (`agents/evaluator-hook.schema.json`) with clarity, accuracy, actionability, SMB relevance, AI literacy, safety, setup difficulty, automation potential, an overall score, and suggested improvements taken from the evaluation's risks.

If `ATLAS_EVALUATOR_COMMAND` is unset, the hook records `not_executed` and leaves the scores empty. It does not invent them. A person still gets `READY_FOR_HUMAN_REVIEW` when QA passed.
