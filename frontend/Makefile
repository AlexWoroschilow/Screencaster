# This file is a part of the ergofox project
# Copyright 2026 Alex Degner (alex.woroschilow@gmail.com)
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
args := $(foreach a,$($(subst -,_,$1)_args),$(if $(value $a),$a="$($a)"))
SCREENS_TO_BUILD := $(shell ls src/ | grep Screen)
SHELL := $(shell which bash)
PWD := $(shell pwd)

.PHONY: all
all: clean screencaster

screencast: screencaster
screen-caster: screencaster
ScreenCaster: screencaster
screencaster:
	make ScreenCasterScreen

server:
	#yes | npm_config_yes=true npx --yes -y webpack serve --config=$(PWD)/src/$(filter-out $@,$(MAKECMDGOALS))/webpack.config.js --mode=development
	npx webpack serve --config=$(PWD)/src/$(filter-out $@,$(MAKECMDGOALS))/webpack.config.js --mode=development
.PHONY: server

clean:
	find $(PWD)/dist/static -maxdepth 1 -name '*mediapipe*' -exec rm -rf {} + || true
	find $(PWD)/dist/static -maxdepth 1 -name '*img*' -exec rm -rf {} +       || true
	find $(PWD)/dist/static -maxdepth 1 -not -type d -delete                  || true
	find $(PWD)/dist -maxdepth 1 -not -type d -delete                         || true

$(SCREENS_TO_BUILD):
	npx webpack --config=$(PWD)/src/$@/webpack.config.js --mode=production

$(SCREENS_TO_EXPORT):
	cp --force $(PWD)/dist/$@  $(PWD)/../../apps/customer/static/js
