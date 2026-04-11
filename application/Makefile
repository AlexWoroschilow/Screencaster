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
PWD := $(shell pwd)
APPIMAGETOOL := ~/.cache/python-appimage/bin/.appimagetool-continuous.appdir.x86_64/usr/bin/appimagetool
BUILD_UNIQUE := $(shell git rev-parse HEAD)

APPRUN := $(PWD)/build/AppRun
DESKTOP := $(PWD)/build/Screencaster.desktop


.PHONY: all

all: build

setup:
	. ./venv/bin/activate
	python3 -m pip install python-appimage --ignore-installed
	python-appimage install appimagetool

build: setup
	. ./venv/bin/activate
	mkdir -p $(PWD)/build/vendors
	python3 -m pip install -r $(PWD)/requirements.txt --ignore-installed --target=$(PWD)/build/vendors

	cp -r static/images/icon.png $(PWD)/build/
	cp main.py $(PWD)/build/
	cp -r static $(PWD)/build/
	cp -r src $(PWD)/build/

	echo '#! /bin/bash' > $(APPRUN)
	echo 'APPDIR="$$(dirname "$$(readlink -f "$${0}")")"' >> $(APPRUN)
	echo 'export APPDIR=$${APPDIR}' >> $(APPRUN)
	echo 'PYTHON3=`which python3`' >> $(APPRUN)
	echo 'PYTHONPATH=$${PYTHONPATH}:$${APPDIR}/vendors' >> $(APPRUN)
	echo 'export PYTHONPATH=$${PYTHONPATH}' >> $(APPRUN)
	echo 'cd $${APPDIR}' >> $(APPRUN)
	echo '"$${PYTHON3}" $${APPDIR}/main.py' >> $(APPRUN)
	echo chmod +x $(APPRUN)

	echo '[Desktop Entry]' > $(DESKTOP)
	echo 'Type=Application' >> $(DESKTOP)
	echo 'Name=Screencaster' >> $(DESKTOP)
	echo 'Exec=AppRun' >> $(DESKTOP)
	echo 'Comment=Application to use any device as your monitor' >> $(DESKTOP)
	echo 'Icon=icon' >> $(DESKTOP)
	echo 'Categories=Utility;' >> $(DESKTOP)
	echo 'Terminal=false' >> $(DESKTOP)

	export ARCH=x86_64 && $(APPIMAGETOOL) ./build/ ../Screencaster-$(ARCH).AppImage

