SHELL := /bin/bash

VENV_DIR ?= .venv
VENV_PYTHON := $(VENV_DIR)/bin/python
PYTHON ?= python3
ifneq ("$(wildcard $(VENV_PYTHON))","")
PYTHON := $(VENV_PYTHON)
endif
PIP ?= $(PYTHON) -m pip

.PHONY: install doctor provision smoke compile bedrock-harness gui clean

install:
	@python3 -c 'import sys; sys.exit(0) if sys.version_info >= (3, 10) else sys.exit("Python 3.10+ is required for this repo.")'
	@if [ ! -x "$(VENV_PYTHON)" ]; then \
		echo "Creating virtual environment at $(VENV_DIR)"; \
		python3 -m venv "$(VENV_DIR)"; \
	fi
	"$(VENV_PYTHON)" -m pip install --upgrade pip
	"$(VENV_PYTHON)" -m pip install -r requirements.txt
	@echo "Install complete. Using $(VENV_PYTHON) for make targets."

doctor:
	$(PYTHON) -m src.tools.doctor

provision:
	$(PYTHON) -m src.tools.provision

smoke:
	CEW_MOCK_AWS=$${CEW_MOCK_AWS:-0} $(PYTHON) -m src.tools.smoke

compile:
	@if [ -z "$(STRATEGY)" ]; then echo "STRATEGY is required (recite|graph_first)"; exit 1; fi
	@if [ -z "$(SESSION)" ]; then echo "SESSION is required"; exit 1; fi
	@if [ -z "$(TASK)" ]; then echo "TASK is required"; exit 1; fi
	CEW_MOCK_AWS=$${CEW_MOCK_AWS:-0} $(PYTHON) -m src.tools.compile_context \
		--strategy $(STRATEGY) \
		--session $(SESSION) \
		--task "$(TASK)" \
		--phase $${PHASE:-VERIFY} \
		--token-budget $${TOKEN_BUDGET:-1200} \
		--output context_pack.json

bedrock-harness:
	@if [ -z "$(SESSION)" ]; then echo "SESSION is required"; exit 1; fi
	@if [ -z "$(GOAL)" ]; then echo "GOAL is required"; exit 1; fi
	CEW_MOCK_AWS=$${CEW_MOCK_AWS:-0} $(PYTHON) -m src.tools.bedrock_harness \
		--session "$(SESSION)" \
		--phase $${PHASE:-PLAN} \
		--goal "$(GOAL)" \
		--session-key $${SESSION_KEY:-harness-main} \
		--max-steps $${MAX_STEPS:-6} \
		--max-history-turns $${MAX_HISTORY_TURNS:-8} \
		--max-tokens $${MAX_TOKENS:-400} \
		--temperature $${TEMPERATURE:-0.0}

gui:
	$(PYTHON) -m src.tools.harness_gui_server --port $${GUI_PORT:-8765}

clean:
	find . -name "__pycache__" -type d -prune -exec rm -rf {} +
	rm -rf .pytest_cache .mypy_cache
	rm -f logs/mock_graph.json logs/mock_receipts.jsonl logs/smoke-last.json
