module task_manage::walrus_integration_tests;

#[test_only]
use sui::test_scenario::{Self as ts, Scenario};
#[test_only]
use sui::clock::{Clock};
#[test_only]
use std::string::{Self};
#[test_only]
use task_manage::task_manage::{
    Self,
    Task,
    TaskRegistry,
    priority_medium,
    role_viewer,
    init_for_testing as init_task_registry,
};
#[test_only]
use task_manage::version::{Version, init_for_testing as init_version};

// Test addresses
const CREATOR: address = @0xA;
const USER_B: address = @0xB;

// Default image URL for tests
const DEFAULT_IMAGE_URL: vector<u8> = b"https://static.vecteezy.com/system/resources/previews/025/638/355/large_2x/simple-task-icon-the-icon-can-be-used-for-websites-print-templates-presentation-templates-illustrations-etc-free-vector.jpg";

// Helper function to create a simple task
fun create_simple_task(scenario: &mut Scenario, creator: address): address {
    ts::next_tx(scenario, creator);
    {
        let version = ts::take_shared<Version>(scenario);
        let mut registry = ts::take_shared<TaskRegistry>(scenario);
        let clock = ts::take_shared<Clock>(scenario);
        let ctx = ts::ctx(scenario);
        let task = task_manage::create_task(
            &version,
            string::utf8(b"Test Task"),
            string::utf8(b"Test Description"),
            string::utf8(DEFAULT_IMAGE_URL),
            option::some(1000000), // due_date
            priority_medium(),
            string::utf8(b"Development"),
            vector[string::utf8(b"urgent"), string::utf8(b"backend")],
            &clock,
            &mut registry,
            ctx,
        );
        let task_id = task_manage::get_task_id(&task);
        ts::return_shared(version);
        ts::return_shared(registry);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, creator);
        task_id
    }
}

// ==================== Walrus/Seal Integration Tests ====================

#[test]
fun test_add_content() {
    let mut scenario = ts::begin(CREATOR);

    // Create system objects including Clock
    ts::create_system_objects(&mut scenario);

    // Initialize version and registry
    ts::next_tx(&mut scenario, CREATOR);
    {
        let ctx = ts::ctx(&mut scenario);
        init_version(ctx);
        init_task_registry(ctx);
    };

    let _task_id = create_simple_task(&mut scenario, CREATOR);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let blob_id = option::some(string::utf8(b"blob_id_12345"));
        task_manage::add_content(&version, &mut task, blob_id, &clock, ctx);

        let content_blob_id = task_manage::get_content_blob_id(&task);
        assert!(option::is_some(&content_blob_id), 0);
        assert!(*option::borrow(&content_blob_id) == string::utf8(b"blob_id_12345"), 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_add_files() {
    let mut scenario = ts::begin(CREATOR);

    // Create system objects including Clock
    ts::create_system_objects(&mut scenario);

    // Initialize version and registry
    ts::next_tx(&mut scenario, CREATOR);
    {
        let ctx = ts::ctx(&mut scenario);
        init_version(ctx);
        init_task_registry(ctx);
    };

    let _task_id = create_simple_task(&mut scenario, CREATOR);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let file_ids = vector[
            string::utf8(b"file_1"),
            string::utf8(b"file_2"),
            string::utf8(b"file_3"),
        ];
        task_manage::add_files(&version, &mut task, file_ids, &clock, ctx);

        let files = task_manage::get_file_blob_ids(&task);
        assert!(vector::length(&files) == 3, 0);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_verify_access_creator() {
    let mut scenario = ts::begin(CREATOR);

    // Create system objects including Clock
    ts::create_system_objects(&mut scenario);

    // Initialize version and registry
    ts::next_tx(&mut scenario, CREATOR);
    {
        let ctx = ts::ctx(&mut scenario);
        init_version(ctx);
        init_task_registry(ctx);
    };

    let _task_id = create_simple_task(&mut scenario, CREATOR);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        assert!(task_manage::verify_access(&task, ctx), 0);

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_verify_access_shared_user() {
    let mut scenario = ts::begin(CREATOR);

    // Create system objects including Clock
    ts::create_system_objects(&mut scenario);

    // Initialize version and registry
    ts::next_tx(&mut scenario, CREATOR);
    {
        let ctx = ts::ctx(&mut scenario);
        init_version(ctx);
        init_task_registry(ctx);
    };

    let _task_id = create_simple_task(&mut scenario, CREATOR);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_viewer(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    ts::next_tx(&mut scenario, USER_B);
    {
        let task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        assert!(task_manage::verify_access(&task, ctx), 0);

        ts::return_shared(version);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}

#[test]
fun test_namespace_generation() {
    let mut scenario = ts::begin(CREATOR);

    // Create system objects including Clock
    ts::create_system_objects(&mut scenario);

    // Initialize version and registry
    ts::next_tx(&mut scenario, CREATOR);
    {
        let ctx = ts::ctx(&mut scenario);
        init_version(ctx);
        init_task_registry(ctx);
    };

    let _task_id = create_simple_task(&mut scenario, CREATOR);

    ts::next_tx(&mut scenario, CREATOR);
    {
        let task = ts::take_from_sender<Task>(&scenario);

        let namespace = task_manage::namespace(&task);
        assert!(vector::length(&namespace) == 32, 0); // Address is 32 bytes

        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

