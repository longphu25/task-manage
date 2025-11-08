module task_manage::access_control_tests;

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
    role_editor,
    role_owner,
    init_for_testing as init_task_registry,
};
#[test_only]
use task_manage::version::{Version, init_for_testing as init_version};

// Test addresses
const CREATOR: address = @0xA;
const USER_B: address = @0xB;
const USER_C: address = @0xC;

// Default image URL for tests
const DEFAULT_IMAGE_URL: vector<u8> =
    b"https://static.vecteezy.com/system/resources/previews/025/638/355/large_2x/simple-task-icon-the-icon-can-be-used-for-websites-print-templates-presentation-templates-illustrations-etc-free-vector.jpg";

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

// ==================== Access Control Tests ====================

#[test]
fun test_share_task_with_role() {
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

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);

        assert!(task_manage::get_user_role(&task, USER_B) == role_editor(), 0);
        assert!(task_manage::has_access(&task, USER_B), 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_update_user_role() {
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

        // Add user as viewer
        task_manage::add_user_with_role(&version, &mut task, USER_B, role_viewer(), &clock, ctx);
        assert!(task_manage::get_user_role(&task, USER_B) == role_viewer(), 0);

        // Upgrade to editor
        task_manage::update_user_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);
        assert!(task_manage::get_user_role(&task, USER_B) == role_editor(), 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_remove_user_access() {
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

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);
        assert!(task_manage::has_access(&task, USER_B), 0);

        task_manage::remove_user(&version, &mut task, USER_B, &clock, ctx);
        assert!(!task_manage::has_access(&task, USER_B), 1);
        assert!(task_manage::get_user_role(&task, USER_B) == 0, 2);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_creator_has_owner_role() {
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

        assert!(task_manage::get_user_role(&task, CREATOR) == role_owner(), 0);
        assert!(task_manage::has_access(&task, CREATOR), 1);

        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EInsufficientPermission)]
fun test_non_owner_cannot_share() {
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

        // Share with USER_B as editor
        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // USER_B tries to share with USER_C (should fail)
    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_C, role_viewer(), &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::ECannotShareWithSelf)]
fun test_cannot_share_with_self() {
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

        task_manage::add_user_with_role(&version, &mut task, CREATOR, role_editor(), &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}
