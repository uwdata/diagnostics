#!/bin/bash

if [ ! -d "node_modules/node" ]
then
	npm install node
fi

if [ ! -d "node_modules/mocha" ]
then
	npm install mocha
fi

if [ ! -d "node_modules/chai" ]
then
	npm install chai
fi

if [ ! -d "node_modules/underscore" ]
then
	npm install underscore
fi

if [ ! -d "node_modules/d3" ]
then
	npm install d3
fi

echo "Running all mocha tests..."
mocha
