SHELL := /bin/bash
PYTHON ?= python3
PIP ?= $(PYTHON) -m pip

.PHONY: install doctor smoke compile clean

install:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

doctor:
	$(PYTHON) -m src.tools.doctor

smoke:
	CEW_MOCK_AWS=$${CEW_MOCK_AWS:-0} $(PYTHON) -m src.tools.smoke

compile:
	@if [ -z "$(STRATEGY)" ]; then echo "STRATEGY is required (recite|graph_first)"; exit 1; fi
	@if [ -z "$(SESSION)" ]; then echo "SESSION is required"; exit 1; fi
	@if [ -z "$(TASK)" ]; then echo "TASK is required"; exit 1; fi
	CEW_MOCK_AWS=$${CEW_MOCK_AWS:-1} $(PYTHON) -m src.tools.compile_context \
		--strategy $(STRATEGY) \
		--session $(SESSION) \
		--task "$(TASK)" \
		--phase $${PHASE:-VERIFY} \
		--token-budget $${TOKEN_BUDGET:-1200} \
		--output context_pack.json

clean:
	find . -name "__pycache__" -type d -prune -exec rm -rf {} +
	rm -rf .pytest_cache .mypy_cache
	rm -f logs/mock_graph.json logs/mock_receipts.jsonl logs/smoke-last.json
