/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */

import { resolve } from 'node:path'

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as main from '../src/main';
import { beforeEach, describe, it, jest } from '@jest/globals';

// Mock the action's main function
const runMock = jest.spyOn(main, 'main');

// Mock the GitHub Actions core library
let errorMock: jest.Spied<typeof core.error> = jest.spyOn(core, 'error');
let noticeMock: jest.Spied<typeof core.notice> = jest.spyOn(core, 'notice');
let getInputMock: jest.Spied<typeof core.getInput> = jest.spyOn(core, 'getInput');
let setFailedMock: jest.Spied<typeof core.setFailed> = jest.spyOn(core, 'setFailed');
let setOutputMock: jest.Spied<typeof core.setOutput> = jest.spyOn(core, 'setOutput');

// Mock the GitHub Actions exec library
let execMock: jest.Spied<typeof exec.exec> = jest.spyOn(exec, 'exec');

// Mock the GitHub Actions io library
let whichMock: jest.Spied<typeof io.which> = jest.spyOn(io, 'which');

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    errorMock?.mockReset();
    noticeMock?.mockReset();
    getInputMock?.mockReset();
    setFailedMock?.mockReset();
    setOutputMock?.mockReset();
    execMock?.mockReset();
    whichMock?.mockReset();
  });

  it('errors on invalid input', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockReturnValue('');

    // Run the action
    await main.main();

    expect(runMock).toHaveReturned();

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(noticeMock).toHaveBeenCalledTimes(0);
    expect(getInputMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledTimes(1);
    expect(setOutputMock).not.toHaveBeenCalled();
    expect(execMock).not.toHaveBeenCalled();
    expect(whichMock).not.toHaveBeenCalled();
  });

  it('does nothing with no libraries passed in', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockReturnValue('{}');

    // Run the action
    await main.main();

    expect(runMock).toHaveReturned();

    expect(errorMock).not.toHaveBeenCalled();
    expect(noticeMock).toHaveBeenCalledTimes(1);
    expect(getInputMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).not.toHaveBeenCalled();
    expect(setOutputMock).not.toHaveBeenCalled();
    expect(execMock).not.toHaveBeenCalled();
    expect(whichMock).not.toHaveBeenCalled();
  });

  it('does updates in only matched project', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockReturnValue(
      JSON.stringify({
        'Some.Library.B': '0.0.2',
      })
    );
    whichMock.mockResolvedValue('/fake/path/to/dotnet');
    execMock.mockResolvedValue(0);

    // Run the action
    await main.main();

    expect(runMock).toHaveReturned();

    expect(errorMock).not.toHaveBeenCalled();
    expect(noticeMock).not.toHaveBeenCalled();
    expect(getInputMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).not.toHaveBeenCalled();
    expect(setOutputMock).not.toHaveBeenCalled();
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(execMock).toHaveBeenNthCalledWith(1, '/fake/path/to/dotnet', [
      'add',
      resolve('__tests__/fixtures/FakeProjectB.csproj'),
      'package',
      'Some.Library.B',
      '--version',
      '0.0.2',
    ]);
    expect(whichMock).toHaveBeenCalledTimes(1);
  });

  it('does updates in all matched projects', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockReturnValue(
      JSON.stringify({
        'Some.Library.A': '0.0.2',
      })
    );
    whichMock.mockResolvedValue('/fake/path/to/dotnet');
    execMock.mockResolvedValue(0);

    // Run the action
    await main.main();

    expect(runMock).toHaveReturned();

    expect(errorMock).not.toHaveBeenCalled();
    expect(noticeMock).not.toHaveBeenCalled();
    expect(getInputMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).not.toHaveBeenCalled();
    expect(setOutputMock).not.toHaveBeenCalled();
    expect(execMock).toHaveBeenCalledTimes(2);
    expect(execMock).toHaveBeenNthCalledWith(1, '/fake/path/to/dotnet', [
      'add',
      resolve('__tests__/fixtures/FakeProjectA.csproj'),
      'package',
      'Some.Library.A',
      '--version',
      '0.0.2',
    ]);
    expect(execMock).toHaveBeenNthCalledWith(2, '/fake/path/to/dotnet', [
      'add',
      resolve('__tests__/fixtures/FakeProjectB.csproj'),
      'package',
      'Some.Library.A',
      '--version',
      '0.0.2',
    ]);
    expect(whichMock).toHaveBeenCalledTimes(1);
  });

  it('fails action when dotnet call fails', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockReturnValue(
      JSON.stringify({
        'Some.Library.A': '0.0.2',
      })
    );
    whichMock.mockResolvedValue('/fake/path/to/dotnet');
    execMock.mockResolvedValue(1);

    // Run the action
    await main.main();

    expect(runMock).toHaveReturned();

    expect(errorMock).toHaveBeenCalledTimes(1);
    expect(noticeMock).not.toHaveBeenCalled();
    expect(getInputMock).toHaveBeenCalledTimes(1);
    expect(setFailedMock).toHaveBeenCalledTimes(1)
    expect(setOutputMock).not.toHaveBeenCalled();
    // Even though both projects match, the action should fail after the first
    expect(execMock).toHaveBeenCalledTimes(1);
    expect(whichMock).toHaveBeenCalledTimes(1);
  });
});
