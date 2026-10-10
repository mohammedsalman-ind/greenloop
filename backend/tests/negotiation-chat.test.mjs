import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { createBackend } from './databaseHarness.mjs';

test('provider and receiver share private chat before and after acceptance without changing terms', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'greenloop-chat-'));
  const server = createBackend({ dataDir: directory });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const client = () => {
    let cookie = '';
    return async (path, method = 'GET', data, expected = 200) => {
      const response = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', 'X-GreenLoop-Client': 'web', Cookie: cookie }, body: data === undefined ? undefined : JSON.stringify(data) });
      if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
      const result = await response.json();
      assert.equal(response.status, expected, JSON.stringify(result));
      return result;
    };
  };
  const provider = client(), receiver = client(), outsider = client();
  const action = (request, name, args, expected = 200) => request('/actions', 'POST', { action: name, args }, expected);
  try {
    for (const [request, name, workspace] of [[provider, 'provider', 'provider'], [receiver, 'receiver', 'receiver'], [outsider, 'outsider', 'receiver']]) {
      await request('/auth/register', 'POST', { email: `chat-${name}@example.com`, password: 'password123' }, 201);
      await request('/profile', 'PATCH', { workspaces: [workspace], activeWorkspace: workspace });
    }
    const project = (await action(provider, 'addProjectAction', [{ name: 'Chat site', location: 'Delhi', status: 'active' }])).result;
    const material = (await action(provider, 'addMaterialAction', [{ projectId: project.id, type: 'brick', quantityT: 7, quantityRangeT: [7, 7], condition: 'good', grade: 'A', confidence: 1, evidence: [] }])).result;
    const demand = (await action(receiver, 'addDemandAction', [{ materialType: 'brick', requiredT: 7, period: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10), location: 'Delhi' }])).result;
    const offered = await action(provider, 'addOfferAction', [{ passportId: material.id, demandId: demand.id, offeredQuantityT: 7, pricePerT: 700 }]);
    const offer = offered.dataset.offers.find(item => item.demandId === demand.id);
    const chat = (request, body, status = 200) => action(request, 'sendNegotiationMessageAction', [offer.id, body], status);
    await chat(provider, 'Could we arrange delivery at 9am?');
    await chat(receiver, 'Yes, please confirm the transport price.');
    await chat(outsider, 'Uninvited message', 403);
    await chat(provider, '   ', 400);
    await chat(receiver, 'x'.repeat(4001), 400);
    await action(receiver, 'acceptOfferAction', [offer.id]);
    await chat(provider, 'Accepted. Delivery is arranged.');
    await chat(receiver, 'Thank you.\nI will meet the driver.');
    const bodies = ['Could we arrange delivery at 9am?', 'Yes, please confirm the transport price.', 'Accepted. Delivery is arranged.', 'Thank you.\nI will meet the driver.'];
    let messages;
    for (const request of [provider, receiver]) {
      const dataset = (await request('/dataset')).dataset;
      const conversation = dataset.negotiations.find(item => item.offerId === offer.id);
      assert.deepEqual(conversation.messages.map(item => item.body), bodies);
      assert.deepEqual(conversation.messages.map(item => item.senderRole), ['provider', 'receiver', 'provider', 'receiver']);
      assert.ok(conversation.messages.every(item => item.senderName && Number.isFinite(Date.parse(item.createdAt))));
      if (messages) assert.deepEqual(conversation.messages, messages);
      messages = conversation.messages;
      assert.equal(conversation.proposals.length, 0);
      const storedOffer = dataset.offers.find(item => item.id === offer.id);
      assert.equal(storedOffer.pricePerT, 700);
      assert.equal(storedOffer.offeredQuantityT, 7);
      assert.equal(storedOffer.status, 'accepted');
      assert.equal(dataset.bookings.length, 0);
    }
    assert.equal((await outsider('/dataset')).dataset.negotiations.length, 0);
    // Withdrawn offers retain history but reject new messages from either side.
    const secondDemand = (await action(receiver, 'addDemandAction', [{ materialType: 'brick', requiredT: 1, period: demand.period, location: 'Delhi' }])).result;
    const second = await action(provider, 'addOfferAction', [{ passportId: material.id, demandId: secondDemand.id, offeredQuantityT: 1, pricePerT: 700 }]);
    const secondOffer = second.dataset.offers.find(item => item.demandId === secondDemand.id);
    await action(provider, 'sendNegotiationMessageAction', [secondOffer.id, 'History remains available.']);
    await action(provider, 'withdrawOfferAction', [secondOffer.id]);
    for (const request of [provider, receiver]) {
      await action(request, 'sendNegotiationMessageAction', [secondOffer.id, 'Closed message'], 409);
      assert.equal((await request('/dataset')).dataset.negotiations.find(item => item.offerId === secondOffer.id).messages.length, 1);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    rmSync(directory, { recursive: true, force: true });
  }
});
