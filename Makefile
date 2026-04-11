# This file is a part of the ergofox project
# Copyright 2020 Alex Woroschilow (alex@ergofox.me)
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
SHELL := /bin/bash
PWD := $(shell pwd)
ARCH := $(shell uname -m)
BUILD_UNIQUE := $(shell git rev-parse HEAD)

APPRUN := $(PWD)/build/AppRun
DESKTOP := $(PWD)/build/Screencaster.desktop
PYTHON_VENV := $(PWD)/application/venv/bin/activate
PYTHON_BINARY := $(shell source $(PYTHON_VENV) && which python3)
APPIMAGETOOL := $(shell source $(PYTHON_VENV) && python-appimage which appimagetool)


.PHONY: all
all: release

clean:
	rm -rf $(PWD)/build
	rm -rf $(PWD)/*.AppImage

release-setup:
	source $(PYTHON_VENV) && $(PYTHON_BINARY) -m pip install python-appimage --ignore-installed
	source $(PYTHON_VENV) && python-appimage install appimagetool

release: clean release-setup

	mkdir -p $(PWD)/build/ffmpeg
	wget -O $(PWD)/build/ffmpeg.tar.xz https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz
	tar -xf $(PWD)/build/ffmpeg.tar.xz -C $(PWD)/build/ffmpeg --strip-components=1
	rm -f $(PWD)/build/ffmpeg.tar.xz

	mkdir -p $(PWD)/build/vendors
	source $(PYTHON_VENV) && $(PYTHON_BINARY) -m pip install -r $(PWD)/application/requirements.txt \
		--target=$(PWD)/build/vendors \
		--ignore-installed

	cp -r application/static/images/icon.png $(PWD)/build/
	cp -r application/main.py $(PWD)/build/
	cp -r application/static $(PWD)/build/
	cp -r application/src $(PWD)/build/


	echo '#! /bin/bash' > $(APPRUN)
	echo 'APPDIR="$$(dirname "$$(readlink -f "$${0}")")"' >> $(APPRUN)
	echo 'export APPDIR=$${APPDIR}' >> $(APPRUN)
	echo 'FFMPEG_BINARY=$${APPDIR}/bin/ffmpeg' >> $(APPRUN)
	echo 'export FFMPEG_BINARY=$${FFMPEG_BINARY}' >> $(APPRUN)
	echo 'FFPLAY_BINARY=$${APPDIR}/bin/ffplay' >> $(APPRUN)
	echo 'export FFPLAY_BINARY=$${FFPLAY_BINARY}' >> $(APPRUN)
	echo 'FFPROBE_BINARY=$${APPDIR}/bin/ffprobe' >> $(APPRUN)
	echo 'export FFPROBE_BINARY=$${FFPROBE_BINARY}' >> $(APPRUN)
	echo 'PYTHONPATH=$${PYTHONPATH}:$${APPDIR}/vendors' >> $(APPRUN)
	echo 'export PYTHONPATH=$${PYTHONPATH}' >> $(APPRUN)
	echo 'cd $${APPDIR}' >> $(APPRUN)
	echo 'PYTHON_BINARY=`which python3`' >> $(APPRUN)
	echo '"$${PYTHON_BINARY}" $${APPDIR}/main.py' >> $(APPRUN)
	chmod +x $(APPRUN)

	echo '[Desktop Entry]' > $(DESKTOP)
	echo 'Type=Application' >> $(DESKTOP)
	echo 'Name=Screencaster' >> $(DESKTOP)
	echo 'Exec=AppRun' >> $(DESKTOP)
	echo 'Comment=Application to use any device as your monitor' >> $(DESKTOP)
	echo 'Icon=icon' >> $(DESKTOP)
	echo 'Categories=Utility;' >> $(DESKTOP)
	echo 'Terminal=false' >> $(DESKTOP)

	export ARCH=$(ARCH) && \
	$(APPIMAGETOOL) ./build/ Screencaster-$(ARCH).AppImage


build-screencaster:
	cd $(PWD)/frontend && docker-compose run screencaster /bin/bash -c "make clean && make ScreenCasterScreen"
	rm --recursive --force $(PWD)/application/src/static/*.js

	cp --recursive --force $(PWD)/frontend/dist/static/*.js                  $(PWD)/application/static/
	cp --recursive --force $(PWD)/frontend/src/ScreenCasterScreen/static/*   $(PWD)/application/static/

frontend: screencaster
screencaster: build-screencaster
