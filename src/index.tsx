#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { openDatabase } from './db/connection.js';
import { App } from './components/App.js';

const { db, startupError } = openDatabase();

render(<App db={db} startupError={startupError} />);
