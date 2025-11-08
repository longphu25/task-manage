module task_manage::reward_system_tests;

#[test_only]
use sui::test_scenario::{Self as ts, Scenario};
#[test_only]
use sui::clock::{Clock};
#[test_only]
use sui::coin::{Self, Coin};
#[test_only]
use sui::sui::SUI;
#[test_only]
use std::string::{Self};
#[test_only]
use task_manage::task_manage::{
    Self,
    Task,
    TaskRegistry,
    priority_medium,
    status_todo,
    status_completed,
    status_archived,
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

// ==================== SUI Reward System Tests ====================

#[test]
fun test_deposit_reward_success() {
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

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        assert!(task_manage::get_reward_balance(&task) == 1000, 0);
        assert!(task_manage::get_deposit_amount(&task, CREATOR) == 1000, 1);

        // Deposit more from same user
        let payment2 = coin::mint_for_testing<SUI>(500, ctx);
        task_manage::deposit_reward(&version, &mut task, payment2, &clock, ctx);

        assert!(task_manage::get_reward_balance(&task) == 1500, 2);
        assert!(task_manage::get_deposit_amount(&task, CREATOR) == 1500, 3);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_deposit_reward_multiple_owners() {
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

    // Make USER_B an owner
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_owner(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // CREATOR deposits
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        assert!(task_manage::get_reward_balance(&task) == 1000, 0);
        assert!(task_manage::get_deposit_amount(&task, CREATOR) == 1000, 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    // USER_B deposits
    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(500, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        assert!(task_manage::get_reward_balance(&task) == 1500, 2);
        assert!(task_manage::get_deposit_amount(&task, USER_B) == 500, 3);
        assert!(task_manage::get_deposit_amount(&task, CREATOR) == 1000, 4);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EInsufficientPermission)]
fun test_non_owner_cannot_deposit() {
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

    // Share with USER_B as editor (not owner)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    // USER_B tries to deposit (should fail)
    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EInvalidAmount)]
fun test_deposit_zero_amount_fails() {
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

        let payment = coin::mint_for_testing<SUI>(0, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::ETaskAlreadyCompleted)]
fun test_deposit_after_completed_fails() {
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
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::update_status(
            &version,
            &mut task,
            status_completed(),
            &clock,
            &mut registry,
            ctx,
        );

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_set_assignee_success() {
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

        task_manage::set_assignee(&version, &mut task, USER_B, &clock, ctx);

        assert!(task_manage::get_assignee(&task) == USER_B, 0);

        // Update assignee
        task_manage::set_assignee(&version, &mut task, USER_C, &clock, ctx);
        assert!(task_manage::get_assignee(&task) == USER_C, 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EInsufficientPermission)]
fun test_non_owner_cannot_set_assignee() {
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

    // Share with USER_B as editor
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    // USER_B tries to set assignee (should fail)
    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::set_assignee(&version, &mut task, USER_C, &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}

#[test]
fun test_approve_completion_success() {
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

    // Deposit reward
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Set assignee and complete task
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::set_assignee(&version, &mut task, USER_B, &clock, ctx);
        task_manage::update_status(
            &version,
            &mut task,
            status_completed(),
            &clock,
            &mut registry,
            ctx,
        );

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Approve completion
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx);

        // Check dynamic fields cleaned up
        assert!(task_manage::get_reward_balance(&task) == 0, 0); // Since removed
        assert!(task_manage::get_deposit_amount(&task, CREATOR) == 0, 1); // Since removed

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    // Check reward transferred to assignee (USER_B)
    ts::next_tx(&mut scenario, USER_B);
    {
        let reward_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&reward_coin) == 1000, 2);

        ts::return_to_sender(&scenario, reward_coin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EAlreadyApproved)]
fun test_approve_completion_twice_fails() {
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

    // Deposit, set assignee, complete
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);
        task_manage::set_assignee(&version, &mut task, USER_B, &clock, ctx);
        task_manage::update_status(
            &version,
            &mut task,
            status_completed(),
            &clock,
            &mut registry,
            ctx,
        );

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // First approve
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx);

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    // Second approve (should fail)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx); // Should fail

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::ETaskNotCompleted)]
fun test_approve_without_completed_fails() {
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

    // Set assignee but not completed
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::set_assignee(&version, &mut task, USER_B, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Try approve (should fail)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx); // Should fail

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::ENoAssignee)]
fun test_approve_without_assignee_fails() {
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

    // Complete but no assignee
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::update_status(
            &version,
            &mut task,
            status_completed(),
            &clock,
            &mut registry,
            ctx,
        );

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Try approve (should fail)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx); // Should fail

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::ENoRewardBalance)]
fun test_approve_without_reward_fails() {
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

    // Set assignee and complete, no deposit
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::set_assignee(&version, &mut task, USER_B, &clock, ctx);
        task_manage::update_status(
            &version,
            &mut task,
            status_completed(),
            &clock,
            &mut registry,
            ctx,
        );

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Try approve (should fail)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::approve_completion(&version, &mut task, ctx); // Should fail

        ts::return_shared(version);
        ts::return_to_sender(&scenario, task);
    };

    ts::end(scenario);
}

#[test]
fun test_cancel_task_refunds() {
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

    // Make USER_B an owner and both deposit
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_owner(), &clock, ctx);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(500, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    // Cancel task (by CREATOR)
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::cancel_task(&version, &mut task, &clock, ctx);

        assert!(task_manage::get_status(&task) == status_todo(), 0);
        assert!(task_manage::get_reward_balance(&task) == 0, 1);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Check refunds
    ts::next_tx(&mut scenario, CREATOR);
    {
        let refund_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&refund_coin) == 1000, 2);
        ts::return_to_sender(&scenario, refund_coin);
    };

    ts::next_tx(&mut scenario, USER_B);
    {
        let refund_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&refund_coin) == 500, 3);
        ts::return_to_sender(&scenario, refund_coin);
    };

    ts::end(scenario);
}

#[test]
fun test_archive_task_refunds() {
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

    // Deposit
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Archive task
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::archive_task(&version, &mut task, &clock, &mut registry, ctx);

        assert!(task_manage::get_status(&task) == status_archived(), 0);
        assert!(task_manage::get_reward_balance(&task) == 0, 1);

        ts::return_shared(registry);
        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Check refund to CREATOR
    ts::next_tx(&mut scenario, CREATOR);
    {
        let refund_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&refund_coin) == 1000, 2);
        ts::return_to_sender(&scenario, refund_coin);
    };

    ts::end(scenario);
}

#[test]
fun test_delete_task_refunds() {
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

    // Deposit
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        let payment = coin::mint_for_testing<SUI>(1000, ctx);
        task_manage::deposit_reward(&version, &mut task, payment, &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_sender(&scenario, task);
    };

    // Delete task
    ts::next_tx(&mut scenario, CREATOR);
    {
        let task = ts::take_from_sender<Task>(&scenario);
        let mut registry = ts::take_shared<TaskRegistry>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::delete_task(&version, task, &mut registry, ctx);

        ts::return_shared(version);
        ts::return_shared(registry);
    };

    // Check refund to CREATOR
    ts::next_tx(&mut scenario, CREATOR);
    {
        let refund_coin = ts::take_from_sender<Coin<SUI>>(&scenario);
        assert!(coin::value(&refund_coin) == 1000, 0);
        ts::return_to_sender(&scenario, refund_coin);
    };

    ts::end(scenario);
}

#[test]
#[expected_failure(abort_code = ::task_manage::task_manage::EInsufficientPermission)]
fun test_non_owner_cannot_cancel() {
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

    // Share with USER_B as editor
    ts::next_tx(&mut scenario, CREATOR);
    {
        let mut task = ts::take_from_sender<Task>(&scenario);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::add_user_with_role(&version, &mut task, USER_B, role_editor(), &clock, ctx);

        ts::return_shared(version);
        ts::return_shared(clock);
        sui::transfer::public_transfer(task, CREATOR);
    };

    // USER_B tries to cancel (should fail)
    ts::next_tx(&mut scenario, USER_B);
    {
        let mut task = ts::take_from_address<Task>(&scenario, CREATOR);
        let version = ts::take_shared<Version>(&scenario);
        let clock = ts::take_shared<Clock>(&scenario);
        let ctx = ts::ctx(&mut scenario);

        task_manage::cancel_task(&version, &mut task, &clock, ctx); // Should fail

        ts::return_shared(version);
        ts::return_shared(clock);
        ts::return_to_address(CREATOR, task);
    };

    ts::end(scenario);
}
