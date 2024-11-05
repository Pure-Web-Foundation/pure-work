## Classes

<dl>
<dt><a href="#Flow">Flow</a></dt>
<dd><p>Flow Engine, implemented using chained promises.</p>
</dd>
<dt><a href="#FlowState">FlowState</a></dt>
<dd><p>FlowState class -  This class is used to store flow state information.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#scrollIntoView">scrollIntoView(element)</a></dt>
<dd><p>Animates an element into view async and returns when the enimation has completed</p>
</dd>
<dt><a href="#EventTargetMixin">EventTargetMixin(superclass)</a> ⇒ <code>T</code></dt>
<dd><p>Mixin for event shortcuts on(), off(), fire()</p>
</dd>
<dt><a href="#fire">fire(eventName, detail)</a></dt>
<dd><p>Dispatch app-level event</p>
</dd>
<dt><a href="#on">on(eventName, func)</a></dt>
<dd><p>Listen for app-level event</p>
</dd>
<dt><a href="#off">off(eventName, func)</a></dt>
<dd><p>Stop listening to app-level event</p>
</dd>
<dt><a href="#withTimeout">withTimeout(promise, timeout)</a> ⇒ <code>Promise</code></dt>
<dd><p>Wraps a promise in a new promise that adds a timeout to the promise execution.</p>
</dd>
</dl>

<a name="FlowState"></a>

## FlowState
FlowState class -  This class is used to store flow state information.

**Kind**: global class  

* [FlowState](#FlowState)
    * [.loadStep(step)](#FlowState+loadStep) ⇒ <code>Object</code>
    * [.saveStep(step)](#FlowState+saveStep)

<a name="FlowState+loadStep"></a>

### flowState.loadStep(step) ⇒ <code>Object</code>
Loads a step

**Kind**: instance method of [<code>FlowState</code>](#FlowState)  

| Param | Type |
| --- | --- |
| step | <code>FlowStep</code> | 

<a name="FlowState+saveStep"></a>

### flowState.saveStep(step)
Saves a step

**Kind**: instance method of [<code>FlowState</code>](#FlowState)  

| Param | Type |
| --- | --- |
| step | <code>FlowStep</code> | 

<a name="scrollIntoView"></a>

## scrollIntoView(element)
Animates an element into view async and returns when the enimation has completed

**Kind**: global function  

| Param | Type |
| --- | --- |
| element | <code>HTMLElement</code> | 

<a name="EventTargetMixin"></a>

## EventTargetMixin(superclass) ⇒ <code>T</code>
Mixin for event shortcuts on(), off(), fire()

**Kind**: global function  

| Param | Type |
| --- | --- |
| superclass | <code>T</code> | 

<a name="fire"></a>

## fire(eventName, detail)
Dispatch app-level event

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| eventName | <code>String</code> |  |
| detail | <code>Object</code> | Optional details to pass along with event |

<a name="on"></a>

## on(eventName, func)
Listen for app-level event

**Kind**: global function  

| Param | Type |
| --- | --- |
| eventName | <code>String</code> | 
| func | <code>function</code> | 

<a name="off"></a>

## off(eventName, func)
Stop listening to app-level event

**Kind**: global function  

| Param | Type |
| --- | --- |
| eventName | <code>String</code> | 
| func | <code>function</code> | 

<a name="withTimeout"></a>

## withTimeout(promise, timeout) ⇒ <code>Promise</code>
Wraps a promise in a new promise that adds a timeout to the promise execution.

**Kind**: global function  

| Param | Type |
| --- | --- |
| promise | <code>Promise</code> | 
| timeout | <code>Number</code> | 

